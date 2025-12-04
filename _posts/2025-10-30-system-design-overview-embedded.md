---
layout: post
title: "System Design Overview: Embedded and IoT Architectures"
date: 2025-10-30 00:00:00 -0700
categories: system-design embedded iot architecture
tags: embedded system-design rtOS dma power-management connectivity observability
permalink: /2025/10/30/system-design-overview-embedded/
excerpt: "Guidelines for architecting embedded/IoT systems: hardware selection, RTOS patterns, connectivity stacks, OTA, security, and observability."
---

# System Design Overview: Embedded and IoT Architectures

Embedded systems combine constrained hardware with demanding reliability targets. This overview summarizes the main decisions for SoCs, firmware, connectivity, and operations.

## Hardware and Platform Choices

- **MCU vs MPU**: MCU (Cortex-M, RISC-V) for deterministic control loops; MPU (Cortex-A) for Linux-class features/UI.
- **Acceleration**: leverage DSP, GPU, NPU for signal processing or ML workloads.
- **Memory Map**: plan SRAM vs external DRAM; map DMA regions with cache coherency considerations.

### Power and Thermal Budget
- Budget mW levels per subsystem; include peak + steady state.
- Apply DVFS, sleep states, and duty cycling for peripherals.
- Separate always-on domain for wake sources (RTC, BLE, GPIO).

## Software Stack

### RTOS and Scheduling
- Pick scheduler (preemptive priority, EDF) matching latency requirements.
- Isolate ISR work: ISR → queue → worker task to keep deterministic latencies.
- Use priority inheritance or priority ceiling mutexes to avoid inversion.

### Firmware Architecture
- Layered drivers: HAL → BSP → middleware → application.
- Abstract peripherals via message queues/event buses to decouple timing.
- Add watchdog/reset reason logging for post-mortem debugging.

## Connectivity and Protocols

- **Local**: SPI/I2C/UART for sensors; use DMA and double buffering.
- **Wireless**: BLE for low power, Wi‑Fi for throughput, Thread/Matter for home automation.
- **Cloud**: MQTT/CoAP/HTTPS; enforce backoff + offline queues.

### Client/Controller Patterns
- Gateway devices: OTA hub, data aggregator, field diagnostics.
- Companion apps: OTA over BLE/Wi‑Fi, log extraction, configuration sync.

## OTA and Security

- Secure boot with signed images, anti-rollback counters, key ladder storage.
- Dual-bank (A/B) firmware images with verified failover.
- Encrypt persistent data; use hardware unique keys (HUK) or TPM.
- Harden debug interfaces (SWD/JTAG) via fuse settings or certificates.

## Observability and Testing

- Instrument runtime metrics: heap usage, stack watermark, ISR latency.
- Export traces via SWO/UART or on-device ring buffers.
- Build hardware-in-loop (HIL) regression rigs with fault injection.
- Maintain golden logs for RF performance, power, and thermal drift.

## Deployment Checklist

1. Bring-up plan (schematics, pin mux, clock tree validation).
2. Manufacturing tests (bed-of-nails, functional soak tests, calibration).
3. Field diagnostics (panic logs, crash signatures, remote reboot).
4. Compliance (FCC/CE/BIS), security audits, lifecycle updates.

Use these sections to structure embedded system design interviews or real-world program reviews.

