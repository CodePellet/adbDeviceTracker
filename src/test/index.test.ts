import { Socket } from "net";
import { AdbDeviceTracker } from "..";

const tracker = AdbDeviceTracker.getInstance();

test("Check if info message is of type string", () => {
    tracker.on("info", message => {
        expect(message).toBeInstanceOf(String);
        // expect((typeof message === 'string')).toBeTruthy();
    });
    tracker.emit("info", "This is a info message");
});

test("Check if error is handled correctly", () => {
    tracker.on("error", error => {
        expect(error.message).toBe("ErrorMessage");
        expect(error.code).toBe("ETESTERROR");
        expect(error.name).toBe("ETESTERROR");
    });
    tracker.emit("error", { message: "ErrorMessage", name: 'ETESTERROR', code: 'ETESTERROR' });
})

test("Check if all adb device data is available", () => {
    tracker.on("data", adbDevices => {
        expect(adbDevices).toBeDefined();
    })
});

