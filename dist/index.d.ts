/// <reference types="node" />
/// <reference types="node" />
import { Socket } from "net";
import { EventEmitter } from "stream";
interface IAdbDevice {
    androidId: string;
    deviceState?: string;
    product?: string;
    model?: string;
    device?: string;
    transportId?: string;
    error?: Error;
}
interface AdbDeviceEvents {
    data: (adbDevices: IAdbDevice[]) => void;
    error: (error: Error) => void;
}
export declare interface AdbDeviceTracker {
    on<U extends keyof AdbDeviceEvents>(event: U, listener: AdbDeviceEvents[U]): this;
    emit<U extends keyof AdbDeviceEvents>(event: U, ...args: Parameters<AdbDeviceEvents[U]>): boolean;
}
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
export {};
