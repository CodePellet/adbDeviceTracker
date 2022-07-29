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
export declare class AdbDeviceTracker extends EventEmitter {
    private adbDevices;
    private socket;
    private socketConfig;
    private timeout;
    constructor(socketConfig?: Partial<ISocketConfig>);
    start(): Socket;
    private onConnect;
    private onData;
    private onClose;
    private onError;
}
export {};
