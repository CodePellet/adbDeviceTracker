"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdbDeviceTracker = void 0;
const child_process_1 = require("child_process");
const net_1 = require("net");
const stream_1 = require("stream");
const zeroPad = (num, places) => String(num).padStart(places, "0");
class AdbDeviceTracker extends stream_1.EventEmitter {
    constructor(socketConfig) {
        super();
        this.socket = new net_1.Socket();
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
        this.socketConfig = Object.assign({ host: "127.0.0.1", port: 5037, autoReconnect: { enabled: true, intervall: 1000 } }, socketConfig);
        this.start = this.start.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.onData = this.onData.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onError = this.onError.bind(this);
        this.socket.on("connect", this.onConnect);
        this.socket.on("data", this.onData);
        this.socket.on("error", this.onError);
        this.socket.on("close", this.onClose);
    }
    execAdbCommand(command, callback) {
        (0, child_process_1.exec)("adb " + command, callback);
    }
    writeToSocket(socket, payload) {
        const payloadLength = zeroPad(payload.length.toString(16), 4);
        const socketWriteResult = socket.write(`${payloadLength}${payload}`);
        if (!socketWriteResult) {
            this.emit("error", { name: "socketWriteDataError", message: "Writing data to socket failed" });
        }
    }
    start() {
        return this.socket.connect({
            host: this.socketConfig.host,
            port: this.socketConfig.port
        });
    }
    onConnect() {
        this.writeToSocket(this.socket, "host:track-devices-l");
        clearTimeout(this.timeout);
        this.emit("info", "[AdbDeviceTracker] Tracker successfully connected to adb socket.");
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
            this.adbDevices.push({ androidId: "-1", error: { name: "ENODEVICES", message: "No devices connected" } });
            this.emit("error", { code: "ENODEVICES", name: "ENODEVICES", message: "No devices connected" });
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
            if (deviceState.toLowerCase() === "authorizing") {
                this.writeToSocket(this.socket, "host:devices-l");
            }
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
        var _a, _b;
        if ((_b = (_a = this.socketConfig) === null || _a === void 0 ? void 0 : _a.autoReconnect) === null || _b === void 0 ? void 0 : _b.enabled)
            this.timeout = setTimeout(this.start, this.socketConfig.autoReconnect.intervall);
    }
    onError(error) {
        this.emit("error", error);
    }
}
exports.AdbDeviceTracker = AdbDeviceTracker;
//# sourceMappingURL=index.js.map