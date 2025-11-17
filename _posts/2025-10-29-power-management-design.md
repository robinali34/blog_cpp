---
layout: post
title: "Power Management for Embedded Systems: Modes, DVFS, and Measurement"
date: 2025-10-29 22:50:00 -0700
categories: embedded power
permalink: /2025/10/29/power-management-design/
tags: [power, dvfs, sleep, measurement, pmic]
---

# Power Management for Embedded Systems

Design strategies and measurements for meeting battery targets.

## Modes

- Active, idle (WFI/WFE), sleep/stop, ship; wake sources; retention RAM.

## DVFS and duty cycling

- Schedule heavy work near charging; reduce sensor/ML rates when unplugged; coalesce wakeups.

## Measurement

- Use power analyzer; log mA vs. mode; compute Wh/day; set budgets per feature.

## Example budget table (per hour)

- BLE idle: 2 mA; IMU 100 Hz: 1 mA; Wi‑Fi bursts: 50 mA for 1% duty; MCU active: 8 mA for 10% duty → avg ≈ ~3.3 mA.

---

## Common Scenarios

### 1. IoT Sensor Node (Temperature/Humidity Logger)

**Use Case**: Battery-powered sensor that reports data every 5 minutes to a gateway.

**Power Profile**:
- Sleep: 5 µA (RTC + retention RAM)
- Wake: 15 mA for 200 ms (sensor read + BLE TX)
- Average: ~10 µA

**Strategy**:
```cpp
// Pseudo-code
void sensor_node_loop() {
    while (true) {
        // Deep sleep for 5 minutes
        enter_deep_sleep(300000);  // 300 seconds
        
        // Wake on RTC interrupt
        wake_on_rtc();
        
        // Read sensor (50 ms @ 5 mA)
        float temp = read_temperature();
        float humidity = read_humidity();
        
        // Transmit via BLE (150 ms @ 20 mA)
        ble_transmit(temp, humidity);
        
        // Return to sleep
    }
}
```

**Power Budget**:
- Sleep (299.8s): 5 µA × 299.8s = 1.5 mAs
- Active (0.2s): 15 mA × 0.2s = 3 mAs
- Total per cycle: 4.5 mAs
- Daily: 4.5 mAs × 288 cycles = 1.3 As ≈ 36 µAh
- **Battery life**: 2000 mAh / 36 µAh/day ≈ **55,000 days** (with 80% efficiency: ~44,000 days)

---

### 2. Wearable Fitness Tracker

**Use Case**: Continuous heart rate monitoring with periodic BLE sync to phone.

**Power Profile**:
- Sleep: 50 µA (sensor polling + minimal processing)
- Active: 8 mA (sensor read + processing)
- BLE TX: 12 mA for 50 ms every 5 seconds
- Display: 2 mA when active (user interaction)

**Strategy**:
- Use low-power sensor interrupt mode
- Batch process sensor data
- Aggressive duty cycling: 1% active, 99% sleep
- Display only on user interaction

**Power Budget** (per hour):
- Sleep (3597s @ 50 µA): 180 mAs
- Active (3s @ 8 mA): 24 mAs
- BLE TX (720 × 50ms @ 12 mA): 432 mAs
- Display (30s @ 2 mA): 60 mAs
- **Total**: ~696 mAs/hour ≈ **0.19 mAh/hour**
- Daily: ~4.6 mAh
- **Battery life**: 100 mAh / 4.6 mAh/day ≈ **21 days**

---

### 3. Edge AI Camera (Motion Detection)

**Use Case**: Battery-powered security camera that wakes on motion, runs ML inference, and uploads images.

**Power Profile**:
- Deep sleep: 100 µA (PIR sensor in interrupt mode)
- Wake: 500 mA for 2 seconds (camera + ML inference)
- Wi-Fi TX: 200 mA for 1 second (image upload)

**Strategy**:
- PIR sensor triggers wake
- Run inference immediately (no buffering)
- Compress image before transmission
- Return to deep sleep after upload

**Power Budget** (assuming 10 events/day):
- Deep sleep (23h 58m @ 100 µA): 8.6 As
- Active (20s @ 500 mA): 10 As
- Wi-Fi TX (10s @ 200 mA): 2 As
- **Daily**: ~20.6 As ≈ **5.7 mAh/day**
- **Battery life**: 5000 mAh / 5.7 mAh/day ≈ **877 days** (2.4 years)

---

### 4. Remote Control Device (BLE Keyboard/Mouse)

**Use Case**: Wireless input device that must respond instantly to user input.

**Power Profile**:
- Idle: 500 µA (BLE advertising)
- Active: 8 mA (key scan + BLE TX)
- Sleep: 10 µA (only during extended inactivity)

**Strategy**:
- Always-on BLE advertising (low power)
- Wake on key press interrupt
- Immediate transmission (latency critical)
- Enter deep sleep after 30s inactivity

**Power Budget** (assuming 2 hours active use/day):
- BLE idle (22h @ 500 µA): 11 As
- Active (2h @ 8 mA): 57.6 As
- **Daily**: ~68.6 As ≈ **19 mAh/day**
- **Battery life**: 500 mAh / 19 mAh/day ≈ **26 days**

---

### 5. Data Logger (Environmental Monitoring)

**Use Case**: Standalone device logging sensor data to SD card, no wireless.

**Power Profile**:
- Sleep: 2 µA (RTC only)
- Wake: 25 mA for 100 ms (sensor read + SD write)
- Logging interval: Every 10 minutes

**Strategy**:
- Deep sleep between logs
- Batch writes to SD card (reduce wear)
- Use low-power RTC for scheduling

**Power Budget**:
- Sleep (599.9s @ 2 µA): 1.2 mAs
- Active (0.1s @ 25 mA): 2.5 mAs
- **Per cycle**: 3.7 mAs
- Daily (144 cycles): 533 mAs ≈ **0.15 mAh/day**
- **Battery life**: 2000 mAh / 0.15 mAh/day ≈ **13,333 days** (36 years)

---

### 6. Smart Door Lock (BLE + Wi-Fi)

**Use Case**: Battery-powered lock with BLE for phone unlock and Wi-Fi for cloud sync.

**Power Profile**:
- Sleep: 20 µA (BLE scanning + RTC)
- BLE active: 8 mA (unlock operation)
- Wi-Fi sync: 150 mA for 5 seconds (every hour)
- Motor: 500 mA for 1 second (unlock)

**Strategy**:
- BLE always scanning (low power mode)
- Wi-Fi only when needed (scheduled sync)
- Motor only during unlock
- Aggressive sleep between operations

**Power Budget** (assuming 10 unlocks/day):
- Sleep (23h 55m @ 20 µA): 1.7 As
- BLE (10 × 2s @ 8 mA): 0.16 As
- Motor (10 × 1s @ 500 mA): 5 As
- Wi-Fi (24 × 5s @ 150 mA): 18 As
- **Daily**: ~25 As ≈ **7 mAh/day**
- **Battery life**: 5000 mAh / 7 mAh/day ≈ **714 days** (2 years)

---

### 7. GPS Tracker (Asset Tracking)

**Use Case**: Battery-powered device reporting location every 15 minutes via cellular.

**Power Profile**:
- Sleep: 5 µA (RTC only)
- GPS fix: 50 mA for 30 seconds
- Cellular TX: 200 mA for 2 seconds

**Strategy**:
- GPS cold start (no hot/warm start to save power)
- Transmit immediately after fix
- Deep sleep between cycles

**Power Budget**:
- Sleep (899s @ 5 µA): 4.5 mAs
- GPS (30s @ 50 mA): 1.5 As
- Cellular (2s @ 200 mA): 0.4 As
- **Per cycle**: ~1.9 As
- Daily (96 cycles): 182 As ≈ **51 mAh/day**
- **Battery life**: 2000 mAh / 51 mAh/day ≈ **39 days**

---

## Scenario Comparison

| Scenario | Avg Current | Daily Consumption | Battery Life (2000 mAh) |
|----------|-------------|-------------------|-------------------------|
| Sensor Node | 10 µA | 36 µAh | 55,000 days |
| Data Logger | 6 µA | 0.15 mAh | 13,333 days |
| Fitness Tracker | 0.19 mA | 4.6 mAh | 435 days |
| Smart Lock | 0.29 mA | 7 mAh | 286 days |
| Edge AI Camera | 0.24 mA | 5.7 mAh | 351 days |
| Remote Control | 0.79 mA | 19 mAh | 105 days |
| GPS Tracker | 2.1 mA | 51 mAh | 39 days |

---

## Key Takeaways

1. **Deep sleep is critical**: Even 10 µA vs 100 µA makes a 10× difference
2. **Duty cycling matters**: 1% active vs 10% active = 10× power savings
3. **Wireless is expensive**: BLE (2-12 mA) < Wi-Fi (50-200 mA) < Cellular (100-500 mA)
4. **Measure everything**: Use power analyzer to validate assumptions
5. **Optimize the hot path**: Focus on frequently executed code
6. **Batch operations**: Reduce wake-up frequency by batching work
