# FRAUD-TEST

This repo is for verifying that editor heartbeats from a Visual Studio extension
match heartbeats recorded by an external device.

## Overview

- The **Visual Studio extension** (a fork of the WakaTime extension) writes
  continuous heartbeat logs to:

  - `logs/vs-heartbeats.log`

- Your **hardware device** (or any external system) writes heartbeats to:

  - `logs/device-heartbeats.log`

The Python scripts in `scripts/` normalize both logs into a common schema and
compare them.

## Setup

1. Clone this repository.

2. Set the environment variable `FRAUD_TEST_ROOT` to the absolute path of this repo, for example:

   - Windows PowerShell:

     ```powershell
     $env:FRAUD_TEST_ROOT = "C:\Users\thisi\OneDrive\Desktop\FRAUD-TEST"
     ```

   - Windows (permanent, from cmd):

     ```bat
     setx FRAUD_TEST_ROOT "C:\Users\thisi\OneDrive\Desktop\FRAUD-TEST"
     ```

3. Open the Visual Studio extension solution:

   - `extension/WakaTime.sln`

   Build and install the Dev17 extension (Visual Studio 2022).

4. Make sure your device writes logs to:

   - `logs/device-heartbeats.log`

   in CSV format with a header row like:

   ```text
   Time,Project,Language,Editor,File Path,Line,Col,Lines,Write,Source,Branch,Category,Machine,User Agent,IP
