/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { ExecException } from "child_process";
import { Socket } from "net";
import { EventEmitter } from "stream";
export interface IAdbDevice {
    androidId: string;
    deviceState?: string;
    product?: string;
    model?: string;
    device?: string;
    transportId?: string;
    error?: Error;
}
export interface ISocketConfig {
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
export interface AdbDeviceTracker {
    on<U extends keyof AdbDeviceEvents>(event: U, listener: AdbDeviceEvents[U]): this;
    emit<U extends keyof AdbDeviceEvents>(event: U, ...args: Parameters<AdbDeviceEvents[U]>): boolean;
}
export declare const zeroPad: (num: string, places: number) => string;
export declare class AdbDeviceTracker extends EventEmitter {
    private static _instance;
    private adbDevices;
    private socket;
    private socketConfig;
    private constructor();
    static getInstance(): AdbDeviceTracker;
    setSocketConfig(socketConfig?: Partial<ISocketConfig>): void;
    server: {
        start: (callback: (error: ExecException | null, stdout: string, stderr: string) => void) => void;
        stop: (callback: (error: ExecException | null, stdout: string, stderr: string) => void) => void;
    };
    private execAdbCommand;
    private writeToSocket;
    start(): Socket;
    private onConnect;
    private onData;
    private onClose;
    private onError;
}
export {};
