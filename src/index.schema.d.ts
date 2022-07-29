export interface IAdbDevice {
    androidId: string;
    deviceState?: string;
    product?: string;
    model?: string;
    device?: string;
    transportId?: string;
    error?: Error
}

export interface ISocketConfig {
    host: string;
    port: number;
    autoReconnect: {
        enabled: boolean;
        intervall: number;
    };
}

export interface AdbDeviceEvents {
    data: (adbDevices: IAdbDevice[]) => void;
    error: (error: Error) => void;
}

export declare interface AdbDeviceTracker {
    on<U extends keyof AdbDeviceEvents>(
        event: U, listener: AdbDeviceEvents[U]
    ): this;

    emit<U extends keyof AdbDeviceEvents>(
        event: U, ...args: Parameters<AdbDeviceEvents[U]>
    ): boolean;
}