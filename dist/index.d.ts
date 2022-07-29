/// <reference types="node" />
/// <reference types="node" />
import { Socket } from "net";
import { EventEmitter } from "stream";
export declare class AdbDeviceTracker extends EventEmitter {
    private static _instance;
    private adbDevices;
    private socket;
    private socketConfig;
    private constructor();
    static getInstance(): AdbDeviceTracker;
    start(): Socket;
    private onData;
    private onClose;
    private onError;
}
