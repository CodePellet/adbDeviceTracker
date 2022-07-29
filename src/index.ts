import { Socket } from "net";
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
  error: (error: Error) => void;
}

export declare interface AdbDeviceTracker {
  on<U extends keyof AdbDeviceEvents>(event: U, listener: AdbDeviceEvents[U]): this;
  emit<U extends keyof AdbDeviceEvents>(event: U, ...args: Parameters<AdbDeviceEvents[U]>): boolean;
}



const zeroPad = (num: string, places: number) => String(num).padStart(places, "0");
export class AdbDeviceTracker extends EventEmitter {

  private adbDevices: IAdbDevice[];
  private socket: Socket = new Socket();
  private socketConfig: ISocketConfig;
  private timeout!: NodeJS.Timeout;

  constructor(socketConfig?: Partial<ISocketConfig>) {
    super();
    this.adbDevices = [];
    this.socketConfig = { host: "127.0.0.1", port: 5037, autoReconnect: { enabled: true, intervall: 1000 }, ...socketConfig };

    this.start = this.start.bind(this);
    this.onConnect = this.onConnect.bind(this);
    this.onData = this.onData.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onError = this.onError.bind(this);

    this.socket.on("connect", this.onConnect)
    this.socket.on("data", this.onData);
    this.socket.on("error", this.onError);
    this.socket.on("close", this.onClose);
  }

  public start(): Socket {
    return this.socket.connect({
      host: this.socketConfig.host,
      port: this.socketConfig.port
    });
  }

  private onConnect() {
    const trackDevicesPayload: string = "host:track-devices-l";
    const trackDevicesPayloadLength = zeroPad(trackDevicesPayload.length.toString(16), 4);
    const socketWriteResult = this.socket.write(`${trackDevicesPayloadLength}${trackDevicesPayload}`);

    clearTimeout(this.timeout);

    if (!socketWriteResult) {
      this.emit("error", { name: "socketWriteDataError", message: "Writing data to socket failed" })
    }
    this.emit("info", "[AdbDeviceTracker] Tracker successfully connected to adb socket.")
  }

  private onData(data: Buffer) {
    this.adbDevices = [];
    const deviceLength = data.toString().replace("OKAY", "").slice(0, 4);

    // Remove the first 4 characters as they represent the data length
    const deviceString = data
      .toString()
      .replace("OKAY", "")
      .slice(4)
      .replace(/\s\s+/g, " ");

    // devices get registered as offline for the first time
    // no information about the device is available at this point
    // so we do not process this event
    if (deviceString.match("offline")) return;

    if (deviceLength.match("0000")) {
      this.adbDevices.push({ androidId: "-1", error: { name: "noDevicesError", message: "No devices connected" } });
      this.emit("error", { name: "noDevicesError", message: "No devices connected" });
      return;
    }

    const devicesArray = deviceString
      .slice(0, deviceString.lastIndexOf("\n"))
      .trim()
      .split("\n");

    // eslint-disable-next-line array-callback-return
    devicesArray.forEach((d) => {
      const [androidId, deviceState, product, model, device, transportId] = d
        .replace(/transport_id:|device:|model:|product:/g, "")
        .split(/\s/g);

      this.adbDevices.push({
        androidId,
        deviceState,
        product,
        model,
        device,
        transportId
      });
    });
    this.emit("data", this.adbDevices);
  }

  private onClose(): void {
    if (this.socketConfig?.autoReconnect?.enabled)
      this.timeout = setTimeout(this.start, this.socketConfig.autoReconnect.intervall);
  }

  private onError(error: Error) {
    this.emit("error", error);
  }

}
