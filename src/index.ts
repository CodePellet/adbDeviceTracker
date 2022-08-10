import { ChildProcess, exec, ExecException, execSync } from "child_process";
import { Socket, createConnection } from "net";
import { EventEmitter } from "stream";

interface IAdbDevice {
  androidId: string;
  deviceState?: string;
  product?: string;
  model?: string;
  device?: string;
  transportId?: string;
  error?: Error
}

interface ISocketConfig {
  host: string;
  port: number;
  autoReconnect: {
    enabled: boolean;
    intervall: number;
  };
}

interface AdbDeviceEvents {
  info: (message: string) => void;
  data: (adbDevices: IAdbDevice[]) => void;
  error: (error: NodeJS.ErrnoException) => void;
}

export declare interface AdbDeviceTracker {
  on<U extends keyof AdbDeviceEvents>(event: U, listener: AdbDeviceEvents[U]): this;
  emit<U extends keyof AdbDeviceEvents>(event: U, ...args: Parameters<AdbDeviceEvents[U]>): boolean;
}

const zeroPad = (num: string, places: number) => String(num).padStart(places, "0");
export class AdbDeviceTracker extends EventEmitter {

  private static _instance: AdbDeviceTracker;
  private adbDevices: IAdbDevice[];
  private socket: Socket;
  private socketConfig: ISocketConfig;

  private constructor() {
    super();
    this.adbDevices = [];
    this.socketConfig = { host: "127.0.0.1", port: 5037, autoReconnect: { enabled: true, intervall: 1000 } };

    this.start = this.start.bind(this);
    this.onConnect = this.onConnect.bind(this);
    this.onData = this.onData.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onError = this.onError.bind(this);
    this.writeToSocket = this.writeToSocket.bind(this);
    this.setSocketConfig = this.setSocketConfig.bind(this);

    this.socket = new Socket();
    this.socket.on("connect", this.onConnect);
    this.socket.on("data", this.onData);
    this.socket.on("error", this.onError);
    this.socket.on("close", this.onClose);
  }

  public static getInstance() {
    return this._instance || (this._instance = new this());
  }

  public setSocketConfig(socketConfig?: Partial<ISocketConfig>): void {
    this.socketConfig = { ...this.socketConfig, ...socketConfig };
  }

  public server = {
    start: (callback: (error: ExecException | null, stdout: string, stderr: string) => void): void => {
      this.execAdbCommand("start-server", function (error, stdout, stderr) {
        if (callback)
          callback(error, stdout, stderr);
      });
    },
    stop: (callback: (error: ExecException | null, stdout: string, stderr: string) => void): void => {
      this.execAdbCommand("kill-server", function (error, stdout, stderr) {
        if (callback)
          callback(error, stdout, stderr);
      });
    }
  };

  private execAdbCommand(command: string, callback: (error: ExecException | null, stdout: string, stderr: string) => void): void {
    exec("adb " + command, callback);
  }

  private writeToSocket(socket: Socket, payload: string): void {
    const payloadLength = zeroPad(payload.length.toString(16), 4);
    const socketWriteResult = socket.write(`${payloadLength}${payload}`);

    if (!socketWriteResult)
      this.emit("error", { name: "socketWriteDataError", message: "Writing data to socket failed" });
  }

  public start(): Socket {
    return this.socket.connect(this.socketConfig);
  }

  private onConnect(): void {
    this.emit("info", "[AdbDeviceTracker] Tracker successfully connected to adb socket.");
    this.writeToSocket(this.socket, "host:track-devices-l");
  }

  private onData(data: Buffer): void {
    const dataString = data.toString().substring(0, data.toString().lastIndexOf("\n")).replace(/^OKAY/g, "").replace(/transport_id:|device:|model:|product:/g, "");

    if (dataString.match("offline")) return;
    // if (dataString.match("authorizing")) return;
    if (dataString === "" || dataString.match("0000")) {
      this.emit("error", { code: "ENODEVICES", name: "ENODEVICES", message: "No devices connected" });
      return;
    }

    // remove duplicates from the string as sometimes the same device is listed multiple times
    const uniqueDevices = Array.from(
      new Set(
        dataString
          .split("\n")
          .map(d =>
            d.replace(/^[A-Za-z0-9]{4}/g, "")
          )
      ));

    this.adbDevices = uniqueDevices.map(d => {
      const [androidId, deviceState, product, model, device, transportId] = d.replace(/\s+/g, " ").split(/\s/g);
      return { androidId, deviceState, product, model, device, transportId };
    });

    this.emit("data", this.adbDevices);
  }

  private onClose(): void {
    if (this.socketConfig.autoReconnect.enabled)
      setTimeout(this.start, this.socketConfig.autoReconnect.intervall);
  }

  private onError(error: NodeJS.ErrnoException): void {
    this.emit("error", error);
  }

}
