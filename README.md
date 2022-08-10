# adbDeviceTracker

Tracks connected adb devices using a websocket connection

# Usage

Add this repository to your project using your prefered package manager:

```
npm i CodePellet/adbDeviceTracker
```

Import `ADBDeviceTracker` as package in your Javascrip or Typescript file:

```ts
import { AdbDeviceTracker } from "adbDeviceTracker";
```

Create a new instance of AdbDeviceTracker:

```ts
const tracker = AdbDeviceTracker.getInstance();
```

# Configuration

The tracker can be instantiated with a few options to make it more versatile. The following options are available:

- `host`: The host address to connect to
- `port`: The host port of the socket
- `autoReconnect`:
  - `enabled`: Boolean value wether the connection to the socket should be automatically reconnected
  - `intervall`: The intervall in `ms` for the reconnect attempts

These options can be passed as an object with the following structure:

> The following values represent the default values if non are provided!

```ts
const tracker = AdbDeviceTracker.getInstance();
tracker.setSocketConfig({
  host: "127.0.0.1",
  port: 5037,
  autoReconnect: {
    enabled: true,
    intervall: 1000,
  },
});
```

# Handling Events

Since this module extends the `EventEmitter` class, the `AdbDeviceTracker` will emit the following custom events:

- info: Info event to provide non critical infos
- data: A collection of all currently connected adb devices on the connected socket
- error: Error events e.g. tracking could not be started or the socket was closed

Furthermore the `start` method of the `AdbDeviceTracker` returns the raw socket created when the `AdbDeviceTracker` was instantiated. This way you are welcome
to handle the socket events yourself if you want to track more than what this module provides.

# Examples

## Track Events emitted from the `AdbDeviceTracker`

```ts
import { AdbDeviceTracker } from "adbdevicetracker";

const tracker = AdbDeviceTracker.getInstance();
tracker.start();

tracker
  .on("info", (message): void => {
    console.info(message);
  })

  .on("data", (adbDevices): void => {
    console.table(adbDevices);
  })

  .on("error", (error): void => {
    console.table(error);
  });
```

## Track Events emitted from the return socket connection of the `start` method

```ts
import { AdbDeviceTracker } from "adbdevicetracker";

const tracker = AdbDeviceTracker.getInstance();

/**
 * Track events emitted by the returned socket of the start() method
 */
const socket = tracker.start();
socket
  .on("connect", (): void => {
    console.info("Socket connected successful");
  })
  .on("data", (data: Buffer): void => {
    console.debug("Data from Socket", data.toString());
  });
```
