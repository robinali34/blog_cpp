---
layout: post
title: "Embedded System Design for a Single Device: Lidar Sensor + Android (Interview Guide)"
date: 2025-10-30 12:00:00 -0700
categories: system-design embedded android iot
permalink: /2025/10/30/embedded-single-device-design-android-lidar/
tags: [embedded, android, system-design, bluetooth, ble, wifi, usb, sensors, lidar, power, security, jni]
---

# Embedded System Design for a Single Device: Lidar Sensor + Android

This interview-oriented guide walks through designing a single embedded device solution: a Lidar sensor streaming measurements to an Android client. It covers requirements, interfaces (BLE/Wi‑Fi/USB), data formats, power, security, diagnostics, testing, and production considerations.

## 1) Problem framing

Goal: Deliver real‑time distance/point data from a Lidar module to an Android app for visualization, logging, and OTA settings.

Non‑functional targets:
- Latency: < 100 ms UI update for basic ranges; < 50 ms for cursor/indicator.
- Throughput: 1–10 kHz measurements (scalar) or 5–20 FPS point clouds (downsampled).
- Battery: Full day at 1 Hz scan logging; 2+ hours at full scan.
- Reliability: Recover from RF interference; persistent logs survive app restarts.

Constraints/assumptions:
- Lidar MCU: Cortex‑M4/M7 class, RTOS or bare‑metal.
- Android 10+ phone/tablet, BLE 5.x preferred; optional Wi‑Fi or USB‑C.

## 2) High‑level architecture

```
┌────────┐      RF/USB      ┌───────────────┐
│ Lidar  │ ◄──────────────► │ Android App   │
│ Module │                  │ (Kotlin/NDK)  │
├────────┤                  ├───────────────┤
│ MCU    │  HAL  ┌───────┐  │ UI/Graph      │
│ + ToF  │ ◄────►│ Driver│  │ Data Store    │
│ Sensor │       └───────┘  │ Transport BLE │
│ RTOS   │  Proto/CRC       │ Wi‑Fi/USB     │
└────────┘                  └───────────────┘
```

Key components:
- Firmware: drivers, sampler, ring buffer, packetizer (CBOR/flat binary), CRC, transport (BLE GATT | Wi‑Fi UDP/TCP | USB CDC).
- Android: transport abstraction, parser, ViewModel, charts (MPAndroidChart), local DB (Room) for logs, settings/OTA.

## 3) Link/transport choices

- BLE (GATT): Low power, ~50–200 KB/s practical. Good for scalar/range streaming and config. Use notify on 185‑byte MTU; split frames.
- Wi‑Fi: High throughput (Mbps). Use UDP for point clouds + FEC or TCP for reliability. Power heavy; AP or SoftAP modes.
- USB‑C (CDC/ACM): Highest reliability/throughput. Requires cable; great for factory/engineering.

Recommendation: Start with BLE for field use; add USB for factory; keep Wi‑Fi for advanced visualization or bulk transfer.

## 4) Data model and framing

Binary record (little‑endian):
```
struct RangeSample {
  uint32_t ts_us;   // capture time
  float    meters;  // distance
  uint16_t snr;     // quality
};

struct Frame {
  uint16_t type;    // 1=range, 2=cloud
  uint16_t count;   // N samples
  uint32_t seq;     // rolling seq
  uint16_t crc16;   // CCITT
  // payload: count * RangeSample
};
```
Design notes:
- Keep fields aligned; cap frame size (< MTU for BLE chunks; e.g., 180 bytes payload each notify).
- Add version byte in header; reserve fields for future.

## 5) Firmware pipeline (MCU)

```
ISR(ToF ready) → Sampler → RingBuffer → Packetizer → Transport(BLE/Wi‑Fi/USB)
```

Guidelines:
- Use lock‑free ring buffer between ISR and packetizer.
- Backpressure: drop oldest non‑critical frames when link stalls; never block ISR.
- Time sync: include `ts_us`; Android may resample for charts.
- CRC16 on each frame; add sequence to detect loss/reorder.

## 6) Android client architecture

Layers:
- Transport: `BleRepository`, `WifiRepository`, `UsbRepository` implement `Transport` interface.
- Parser: converts `ByteArray` → `Frame`/`RangeSample` (JNI C++ or Kotlin).
- ViewModel: exposes `StateFlow<UiState>` to UI; buffers with bounded queue.
- Storage: `Room` for sessions; export CSV.
- UI: live chart, quality indicators, connection panel, settings.

Transport interface (Kotlin):
```kotlin
interface Transport {
  fun connect(): Flow<ConnectionState>
  fun incoming(): Flow<ByteArray>
  suspend fun write(cmd: ByteArray)
  suspend fun disconnect()
}
```

JNI parser stub (C++):
```cpp
extern "C" JNIEXPORT jobject JNICALL
Java_com_acme_lidar_Native_parseFrame(JNIEnv* env, jclass, jbyteArray data) {
    // Validate, parse header, verify CRC, return Java Frame object
    // Keep parser in C++ for speed; use direct ByteBuffer where possible
    return nullptr; // demo
}
```

## 7) Commands and settings (GATT example)

GATT services/characteristics:
- LIDAR_DATA_NOTIFY (notify)
- LIDAR_CMD_WRITE (write): set rate, start/stop, power mode
- LIDAR_STATUS_READ (read): fw version, health

Command frame (CBOR or TLV) example:
```
{ op: "set_rate", hz: 50 }
{ op: "power", mode: "low" }
```

## 8) Power & thermal

- Modes: active, low‑power (reduced laser duty), standby (sensor off; BLE idle), ship (all off, wake pin).
- Budgeting: estimate mA for sensor + MCU + radio; ensure battery peak current headroom.
- Thermal throttling: reduce sample rate if temperature > threshold.

## 9) Security

- BLE: LE Secure Connections pairing; bond; rotate random address; authenticate commands.
- Wi‑Fi: WPA2; application‑level token; sign OTA with Ed25519.
- USB: vendor protocol with CRC + versioning; protect destructive commands behind signed session.

## 10) Diagnostics & update

- Health metrics: temperature, laser current, CRC errors, frame drops, RSSI.
- Logs: ring log on MCU; upload via USB for RMA.
- OTA: DFU over BLE with chunking + resume; verify signature before apply.

## 11) Testing & validation

- Unit tests: parser, CRC, sequence handling.
- HIL: record/replay real frames to validate Android UI and storage.
- RF tests: interference (microwave, crowded 2.4 GHz), throughput at distance.
- Power tests: worst‑case scan; thermal chamber.

## 12) Interview drill‑down prompts

- Throughput math: Can BLE sustain X FPS? Show calculations for MTU, interval, notifications per conn event.
- Backpressure strategy: drop policy vs. queue growth; prioritize status vs. bulk.
- Data integrity: CRC vs. checksum; sequence gaps, reordering.
- Time sync: device vs. host clock; how to align charts.
- Failure modes: partial OTA, GATT characteristic full, Android background limits.

## 13) Example throughput estimate (BLE)

Assume 20 bytes effective per notification (safe, conservative), 6 notifies/conn interval, 15 ms interval:

Throughput ≈ (20 * 6) / 0.015 ≈ 8,000 B/s ≈ 8 KB/s.

With larger MTU (185 B), 4 notifies/interval, 15 ms:

Throughput ≈ (185 * 4) / 0.015 ≈ 49 KB/s.

Enough for 1–2 kHz scalar ranges (few bytes/sample). For point clouds, prefer Wi‑Fi or USB.

## 14) Minimal BLE packetizer (C++)

```cpp
struct Packetizer {
  static constexpr size_t MTU = 185; // negotiated
  std::vector<std::array<uint8_t, MTU>> chunk(const uint8_t* data, size_t len) {
    std::vector<std::array<uint8_t, MTU>> out;
    size_t off = 0;
    while (off < len) {
      size_t n = std::min(MTU, len - off);
      std::array<uint8_t, MTU> buf{};
      std::memcpy(buf.data(), data + off, n);
      out.push_back(buf);
      off += n;
    }
    return out;
  }
};
```

## 15) What to communicate in interviews

- Enumerate link options with trade‑offs (BLE vs. Wi‑Fi vs. USB) and choose based on requirements.
- Show data model, framing, CRC, and error handling.
- Explain backpressure and buffering strategy.
- Cover power modes and thermal limits.
- Include security, diagnostics, OTA update path.
- Provide testing plan and factory flow.

This template generalizes beyond Lidar to any single‑device sensor (IMU, ToF array, environmental). Adjust payload and throughput accordingly.


