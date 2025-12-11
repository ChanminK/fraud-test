using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Shell.Interop;
using System;
using System.Globalization;
using System.IO;
using WakaTime.Shared.ExtensionUtils;

namespace WakaTime.ExtensionUtils
{
    public class Logger : ILogger
    {
        private readonly bool _isDebugEnabled;
        private readonly string _logFilePath;
        private readonly object _logFileLock = new object();

        private IVsOutputWindowPane _wakatimeOutputWindowPane;
        private IVsOutputWindowPane WakatimeOutputWindowPane =>
            _wakatimeOutputWindowPane ?? (_wakatimeOutputWindowPane = GetWakatimeOutputWindowPane());

        /// <summary>
        /// configFilepath is the path to the WakaTime config file
        /// </summary>
        public Logger(string configFilepath)
        {
            var rootDir = Path.GetDirectoryName(configFilepath);

            if (string.IsNullOrEmpty(rootDir))
                rootDir = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

            var logsDir = Path.Combine(rootDir, "Logs");
            Directory.CreateDirectory(logsDir);

            _logFilePath = Path.Combine(logsDir, "vs-extension.log");

            try
            {
                var config = new ConfigFile(configFilepath);
                _isDebugEnabled = config.GetSettingAsBoolean("debug");
            }
            catch
            {
                // logging everything for now
                _isDebugEnabled = true;
            }
        }

        public bool IsDebugEnabled => _isDebugEnabled;

        public void Debug(string message)
        {
            if (!_isDebugEnabled)
                return;

            Log(LogLevel.Debug, message);
        }

        public void Debug(string message, Exception ex)
        {
            if (!_isDebugEnabled)
                return;

            Log(LogLevel.Debug, $"{message} {ex}");
        }

        public void Warning(string message)
        {
            Log(LogLevel.Warning, message);
        }

        public void Warning(string message, Exception ex)
        {
            Log(LogLevel.Warning, $"{message} {ex}");
        }

        public void Error(string message)
        {
            Log(LogLevel.Error, message);
        }

        public void Error(string message, Exception ex)
        {
            Log(LogLevel.Error, $"{message} {ex}");
        }

        public void Log(LogLevel level, string message)
        {
            if (string.IsNullOrEmpty(message))
                return;

            var timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture);
            var levelString = Enum.GetName(typeof(LogLevel), level)?
                                   .ToUpper(CultureInfo.InvariantCulture) ?? "INFO";

            var outputMessage = $"[WakaTime {levelString}] {message}{Environment.NewLine}";
            var lineForFile  = $"{timestamp} [{levelString}] {message}{Environment.NewLine}";

            try
            {
                ThreadHelper.JoinableTaskFactory.Run(async delegate
                {
                    await ThreadHelper.JoinableTaskFactory.SwitchToMainThreadAsync();
                    var outputWindowPane = WakatimeOutputWindowPane;
                    outputWindowPane?.OutputString(outputMessage);
                });
            }
            catch
            {
                // Don't let logging exceptions break anything
            }

            // Log file in disk (FRAUD-TEST/Logs/vs-extension.log)
            try
            {
                lock (_logFileLock)
                {
                    File.AppendAllText(_logFilePath, lineForFile);
                }
            }
            catch
            {
            }
        }

        private static IVsOutputWindowPane GetWakatimeOutputWindowPane()
        {
            ThreadHelper.ThrowIfNotOnUIThread();

            var outputWindow = Package.GetGlobalService(typeof(SVsOutputWindow)) as IVsOutputWindow;
            if (outputWindow == null)
                return null;

            var paneGuid = new Guid("C51F5922-10C3-4C69-8F07-3B0598AFA123");

            IVsOutputWindowPane pane;
            if (ErrorHandler.Failed(outputWindow.GetPane(ref paneGuid, out pane)) || pane == null)
            {
                outputWindow.CreatePane(ref paneGuid, "WakaTime (FRAUD-TEST)", fInitVisible: 1, fClearWithSolution: 0);
                outputWindow.GetPane(ref paneGuid, out pane);
            }

            return pane;
        }
    }
}
