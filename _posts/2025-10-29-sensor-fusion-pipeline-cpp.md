---
layout: post
title: "Sensor Fusion Pipeline in C++: IMU + Lidar with Bounded Latency"
date: 2025-10-29 22:45:00 -0700
categories: embedded sensors cpp
permalink: /2025/10/29/sensor-fusion-pipeline-cpp/
tags: [imu, lidar, sensor-fusion, filters, latency, time-sync]
---

# Sensor Fusion Pipeline in C++

Design a bounded‑latency pipeline that fuses IMU and Lidar with timestamp alignment.

## Time sync and buffers

- Timestamps in µs from device; align via clock offset calibration; maintain small de‑jitter buffers.

```cpp
struct Sample { int64_t ts_us; Eigen::Vector3f v; };
std::deque<Sample> imuQ, lidarQ; // capped length

// align within ±10ms window
```

## Filter step

```cpp
struct State { Eigen::Vector3f pos, vel; Eigen::Quaternionf q; };
void predict(State& s, const Sample& imu, float dt);
void update(State& s, const Sample& lidar);
```

## Latency budget

- End‑to‑end < 30 ms: IMU ISR→queue (<1 ms), predictor (<1 ms), lidar update (<2 ms), render/logging async.

