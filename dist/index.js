"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdbDeviceTracker = void 0;
const child_process_1 = require("child_process");
const net_1 = require("net");
const stream_1 = require("stream");
const zeroPad = (num, places) => String(num).padStart(places, "0");
class AdbDeviceTracker extends stream_1.EventEmitter {
    constructor() {
        super();
        this.server = {
            start: (callback) => {
                this.execAdbCommand("start-server", function (error, stdout, stderr) {
                    if (callback)
                        callback(error, stdout, stderr);
                });
            },
            stop: (callback) => {
                this.execAdbCommand("kill-server", function (error, stdout, stderr) {
                    if (callback)
                        callback(error, stdout, stderr);
                });
            }
        };
        this.adbDevices = [];
        this.socketConfig = { host: "127.0.0.1", port: 5037, autoReconnect: { enabled: true, intervall: 1000 } };
        this.start = this.start.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.onData = this.onData.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onError = this.onError.bind(this);
        this.writeToSocket = this.writeToSocket.bind(this);
        this.setSocketConfig = this.setSocketConfig.bind(this);
        this.socket = new net_1.Socket();
        this.socket.on("connect", this.onConnect);
        this.socket.on("data", this.onData);
        this.socket.on("error", this.onError);
        this.socket.on("close", this.onClose);
    }
    static getInstance() {
        return this._instance || (this._instance = new this());
    }
    setSocketConfig(socketConfig) {
        this.socketConfig = Object.assign(Object.assign({}, this.socketConfig), socketConfig);
    }
    execAdbCommand(command, callback) {
        (0, child_process_1.exec)("adb " + command, callback);
    }
    writeToSocket(socket, payload) {
        const payloadLength = zeroPad(payload.length.toString(16), 4);
        const socketWriteResult = socket.write(`${payloadLength}${payload}`);
        if (!socketWriteResult)
            this.emit("error", { name: "socketWriteDataError", message: "Writing data to socket failed" });
    }
    start() {
        this.socket.connect(this.socketConfig);
    }
    onConnect() {
        this.emit("info", "[AdbDeviceTracker] Tracker successfully connected to adb socket.");
        this.writeToSocket(this.socket, "host:track-devices-l");
    }
    onData(data) {
        const dataString = data.toString().replace(/^OKAY/g, "").replace(/^[A-Za-z0-9]{4}/g, "").replace(/transport_id:|device:|model:|product:/g, "").replace(/\s+/g, " ");
        if (dataString.match("offline"))
            return;
        if (dataString.match("authorizing"))
            return;
        if (dataString === "" || dataString.match("0000")) {
            this.emit("error", { code: "ENODEVICES", name: "ENODEVICES", message: "No devices connected" });
            return;
        }
        const cleanedString = Array.from(new Set(dataString.split("\n"))).toString();
        this.adbDevices = cleanedString.split("\n").map(d => {
            const [androidId, deviceState, product, model, device, transportId] = d.split(/\s/g);
            return { androidId, deviceState, product, model, device, transportId };
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