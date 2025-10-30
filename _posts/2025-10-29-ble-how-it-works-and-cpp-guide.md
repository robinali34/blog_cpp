---
layout: post
title: "Bluetooth Low Energy (BLE): How It Works and C++ Usage"
date: 2025-10-29 00:00:00 -0700
categories: cpp ble networking wireless
permalink: /2025/10/29/ble-how-it-works-and-cpp-guide/
tags: [ble, bluetooth, gatt, gap, cpp, bluez, android-ndk]
---

# Bluetooth Low Energy (BLE): How It Works and C++ Usage

A practical guide to BLE fundamentals—GAP, GATT, services/characteristics, advertising/connection intervals—and how to interact from C++ on Linux (BlueZ) and Android NDK.

## BLE Fundamentals (Quick Primer)

- **GAP (Generic Access Profile)**: device roles and procedures (advertising, scanning, connecting)
  - Peripheral advertises; Central scans/connects
  - Advertising interval impacts power and discovery latency
- **GATT (Generic Attribute Profile)**: data model over an ATT attribute table
  - Hierarchy: Service → Characteristic(s) (+ Descriptors)
  - Operations: Read/Write, Notify/Indicate (server→client updates)
- **UUIDs**: 16/32/128‑bit identifiers for services/characteristics
- **MTU**: negotiated packet size for attribute data
- **Security**: pairing/bonding, encryption, LE Secure Connections (ECDH)

Typical patterns:
- Phone (central) ↔ Device (peripheral) with custom GATT service
- Notify for telemetry; write commands; read configuration

---

## Linux (BlueZ) with C++

BlueZ provides D‑Bus APIs (recommended), or experimental HCI sockets. From C++, use a D‑Bus client (sdbus‑c++, QtDBus, or raw libdbus).

### Discover + Connect + GATT (sdbus‑c++ example outline)

```cpp
// g++ -std=c++20 -lsdbus-c++ ble_client.cpp -o ble_client
#include <sdbus-c++/sdbus-c++.h>
#include <iostream>

int main(){
    using namespace std::string_literals;
    auto conn = sdbus::createSystemBusConnection();
    auto obj  = sdbus::createProxy(*conn, "org.bluez", "/org/bluez/hci0");

    // Start discovery (GAP Scan)
    obj->callMethod("StartDiscovery").onInterface("org.bluez.Adapter1").withNoArguments();

    // Listen for InterfacesAdded signals to find target device by Address/Name
    // (subscribe to org.freedesktop.DBus.ObjectManager InterfacesAdded)

    // Suppose we resolved device path: /org/bluez/hci0/dev_XX_XX_XX_XX_XX_XX
    std::string devPath = "/org/bluez/hci0/dev_XX_XX_XX_XX_XX_XX";
    auto dev = sdbus::createProxy(*conn, "org.bluez", devPath);

    // Connect
    dev->callMethod("Connect").onInterface("org.bluez.Device1").withNoArguments();

    // Resolve GATT services/characteristics (via ObjectManager children under device)
    // Find characteristic by UUID, get its object path: .../serviceXXXX/charYYYY
    std::string charPath = devPath + "/serviceXXXX/charYYYY"; // placeholder
    auto ch = sdbus::createProxy(*conn, "org.bluez", charPath);

    // Read characteristic
    sdbus::VariantMap opts; // empty options
    auto reply = ch->callMethod("ReadValue").onInterface("org.bluez.GattCharacteristic1").withArguments(opts);

    // Write characteristic (WriteWithoutResponse or WriteValue)
    std::vector<uint8_t> data = {0x01, 0x02};
    sdbus::VariantMap wopts; // e.g., {"type":"request"}
    ch->callMethod("WriteValue").onInterface("org.bluez.GattCharacteristic1").withArguments(data, wopts);

    // Enable notifications: set Notify=true and listen PropertiesChanged for Value
    // ch.Set("org.bluez.GattCharacteristic1", "Notifying", true)

    // Stop discovery (optional) and clean up when done
    obj->callMethod("StopDiscovery").onInterface("org.bluez.Adapter1").withNoArguments();
}
```

Notes:
- Use ObjectManager to enumerate services/characteristics; match UUIDs
- Subscribe to `PropertiesChanged` on `GattCharacteristic1` to receive notifications
- For server/peripheral roles on Linux, BlueZ GATT server via D‑Bus (`org.bluez.GattManager1`)

---

## Android (NDK) from C++

BLE APIs are Java/Kotlin in Android; from C++ you typically bridge via JNI/AIDL:
- Java/Kotlin layer: `BluetoothManager`, `BluetoothAdapter`, `BluetoothGatt`, `BluetoothLeScanner`
- NDK/C++ layer: provide native callbacks via JNI to pass scan results, connection state, and GATT events

### Minimal Flow (UI/Service in Kotlin + JNI)

1) Kotlin: scan/connect, discover services, read/write/notify
2) Kotlin → JNI: forward events/payloads into C++ (e.g., for protocol handling)
3) C++ → JNI: request write/read, enable notifications

Kotlin sketch:
```kotlin
val scanner = BluetoothAdapter.getDefaultAdapter().bluetoothLeScanner
val filters = listOf(ScanFilter.Builder().setServiceUuid(ParcelUuid.fromString(MY_UUID)).build())
val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
scanner.startScan(filters, settings, scanCallback)

// On device found, connect:
device.connectGatt(context, false, gattCallback)

// In gattCallback.onServicesDiscovered: find characteristic by UUID and set notifications
```

Bridge to C++:
```cpp
// JNI functions called by Kotlin to deliver events to native
extern "C" JNIEXPORT void JNICALL
Java_app_BleService_onNotify(JNIEnv*, jobject, jbyteArray data){
    // Convert to std::vector<uint8_t>, process in C++
}

// Native requests write
void nativeWrite(JNIEnv* env, jobject gatt, jbyteArray value){
    // Call into Kotlin/Java to perform BluetoothGattCharacteristic write
}
```

Tips:
- Keep BLE on the Java side; use C++ for packet parsing/state machines
- Use a foreground service for stable connections; handle permissions (BLUETOOTH, BLUETOOTH_ADMIN, BLUETOOTH_CONNECT/SCAN/ADVERTISE on recent Android)

---

## Cross‑Platform C++ Abstraction (Client‑side)

Define a minimal interface and provide platform backends (Linux BlueZ via D‑Bus; Android JNI bridge):

```cpp
struct BleClient {
    virtual ~BleClient() = default;
    virtual void startScan(const std::string& serviceUuid) = 0;
    virtual void stopScan() = 0;
    virtual bool connect(const std::string& address) = 0;
    virtual void disconnect() = 0;
    virtual bool readChar(const std::string& charUuid, std::vector<uint8_t>& out) = 0;
    virtual bool writeChar(const std::string& charUuid, std::span<const uint8_t> data, bool withResponse) = 0;
    virtual bool setNotify(const std::string& charUuid, bool enable) = 0;
};
```

- Implement `BleClientBlueZ` and `BleClientAndroid`
- Use UUID strings consistently; resolve to object paths (BlueZ) or `BluetoothGattCharacteristic` (Android)

---

## GATT Server (Peripheral) Basics (Linux)

- Implement with BlueZ GATT server: register application via `GattManager1`
- Define service/characteristics (UUIDs, properties), handle `ReadValue`/`WriteValue`, and send notifications via `PropertiesChanged`

---

## Performance & Power Tips

- Balance advertising/connection intervals with discovery latency and power budget
- Use notifications (not polling reads) for telemetry
- Batch writes where possible; increase MTU if supported
- Handle reconnect/backoff; store bonds (pairing) where applicable

## Security Notes

- Use LE Secure Connections; require encryption before sensitive characteristics
- Whitelist known centrals/peripherals where feasible
- Rotate secrets; reject unauthenticated writes

---

## Troubleshooting Checklist

- Permissions and adapter power state (rfkill/Android runtime perms)
- MTU negotiation; characteristic properties (read/write/notify)
- D‑Bus object paths/UUID mismatch (Linux); GATT cache issues (Android → clear cache/reconnect)
- Sniff with btmon/hcidump (Linux) or Android bugreport; use a BLE sniffer for radio‑level issues

---

This guide gives you the building blocks to scan, connect, and exchange GATT data from C++. For production systems, wrap platform details behind a small interface, enforce security, and invest in robust reconnect and state machines.
