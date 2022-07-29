"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdbDeviceTracker = void 0;
const net_1 = require("net");
const stream_1 = require("stream");
const zeroPad = (num, places) => String(num).padStart(places, "0");
class AdbDeviceTracker extends stream_1.EventEmitter {
    constructor(socketConfig) {
        super();
        this.adbDevices = [];
        this.socketConfig = socketConfig || { host: "127.0.0.1", port: 5037, autoReconnect: { enabled: true, intervall: 1000 } };
        this.socket = new net_1.Socket();
        this.onData = this.onData.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onError = this.onError.bind(this);
        this.socket.on("data", this.onData);
        this.socket.on("error", this.onError);
        this.socket.on("close", this.onClose);
    }
    static getInstance() {
        return this._instance || (this._instance = new this());
    }
    start() {
        return this.socket.connect({
            host: this.socketConfig.host,
            port: this.socketConfig.port
        }).on("connect", () => {
            const trackDevicesPayload = "host:track-devices-l";
            const trackDevicesPayloadLength = zeroPad(trackDevicesPayload.length.toString(16), 4);
            const socketWriteResult = this.socket.write(`${trackDevicesPayloadLength}${trackDevicesPayload}`);
            if (!socketWriteResult) {
                this.socket.destroy({ name: "socketWriteDataError", message: "Writing data to socket failed" });
            }
        });
    }
    onData(data) {
        this.adbDevices = [];
        const deviceLength = data.toString().replace("OKAY", "").slice(0, 4);
        const deviceString = data
            .toString()
            .replace("OKAY", "")
            .slice(4)
            .replace(/\s\s+/g, " ");
        if (deviceString.match("offline"))
            return;
        if (deviceLength.match("0000")) {
            this.adbDevices.push({ androidId: "-1", error: { name: "noDevicesError", message: "No devices connected" } });
            this.emit("error", { name: "noDevicesError", message: "No devices connected" });
            return;
        }
        const devicesArray = deviceString
            .slice(0, deviceString.lastIndexOf("\n"))
            .trim()
            .split("\n");
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
    onClose() {
        if (this.socketConfig.autoReconnect.enabled)
            setTimeout(this.start, this.socketConfig.autoReconnect.intervall);
    }
    onError(error) {
        this.emit("error", error);
    }
}
exports.AdbDeviceTracker = AdbDeviceTracker;
//# sourceMappingURL=index.js.map