# FRAUD-TEST

This repo compares WakaTime-style editor heartbeats against data from a hardware device.

## Setup

1. Clone this repo.
2. Set the environment variable `FRAUD_TEST_ROOT` to the absolute path of this repo.
3. Open `extension/WakaTime.sln` in Visual Studio and build/install the extension.
4. Ensure your device writes heartbeats to `logs/device-heartbeats.log`.

While you code, the Visual Studio extension will write a continuous log to:

- `logs/vs-heartbeats.log` (when `FRAUD_TEST_ROOT` is set)

## Comparing heartbeats

```bash
cd scripts
python compare_heartbeats.py \
  --vs ../logs/vs-heartbeats.log \
  --device ../logs/device-heartbeats.log
