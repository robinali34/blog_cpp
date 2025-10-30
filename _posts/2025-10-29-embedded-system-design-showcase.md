---
layout: post
title: "Senior Embedded C++ System Design Showcase"
date: 2025-10-29 23:30:00 -0700
categories: embedded system-design cpp
permalink: /2025/10/29/embedded-system-design-showcase/
tags: [embedded, cpp, system-design, rtos, dma, ble, ota]
---

# Senior Embedded C++ System Design Showcase

This page highlights end‑to‑end embedded system designs, C++ patterns, and case studies suitable for a senior embedded C++ engineer portfolio and interviews.

## Design principles (embedded + C++)

- Determinism first: bounded latencies, ISR minimization, DMA offload, RTOS priorities.
- Correctness and safety: `volatile` MMIO, race‑free lock strategies, W1C semantics, memory barriers.
- Power/perf co‑design: DVFS, duty cycling, zero‑copy paths, cache‑aware data structures.
- Robust comms: versioned binary protocols (TLV/CBOR), CRC/seq, backpressure, resumable transfers.
- Secure by default: secure boot, key storage, least‑privilege, signed OTAs.

## Reference stacks

- Bare‑metal/RTOS pipeline: ISR → ring buffer → worker task → packetizer → transport (BLE/Wi‑Fi/USB) → storage/telemetry.
- Android device controller: Kotlin UI + foreground service → AIDL/Binder → NDK/JNI parsers → USB/BLE/Wi‑Fi transports.

## Case studies (deep dives)

- Lidar + Android controller (single‑device embedded design): {% post_url 2025-10-29-embedded-single-device-design-android-lidar %}
- Port I/O read/write (8/16/32‑bit, barriers, endianness): {% post_url 2025-10-29-embedded-port-io-read-write %}
- USB reader/writer (CDC‑ACM + libusb bulk): {% post_url 2025-10-29-usb-reader-writer-embedded-cpp %}
- Android USB Host (CDC/Bulk) in Kotlin: {% post_url 2025-10-29-android-usb-reader-writer %}
- PCI config/MMIO access from C++ (libpci + mmap): {% post_url 2025-10-29-pci-read-write-with-cpp %}
- Matter/CHIP device/controller examples: {% post_url 2025-10-29-matter-with-cpp-intro-and-examples %}

## C++ patterns that scale on MCUs/SoCs

- Zero‑cost abstractions; `span`/`string_view` for bounds‑aware views.
- `std::atomic` with precise memory orders; lock‑free ring buffers for ISR↔task.
- RAII for DMA/lock lifetimes; `gsl::final_action` for cleanup.
- Fixed‑capacity allocators; intrusive containers for no‑heap regions.
- Parse/serialize with constexpr tables; small‑buffer optimization where applicable.

## Performance & reliability playbook

- Latency budget: instrument ISR to app; flame‑graph the pipeline; budget per hop.
- Throughput: chunk sizing vs. MTU, double‑buffering, cache‑line alignment, prefetch.
- Resilience: watchdog strategy, brownout handling, write‑amortized flash logging.
- Power: measure in mA over modes; A/B experiments for ML/compression vs. battery.

## Security & OTA

- Chain‑of‑trust boot, KeyMint/TEE (Android) or MCU secure elements.
- Signed delta OTAs with resume; staged rollouts; rollback guards.

## Measurement & test

- Hardware‑in‑the‑loop record/replay; determinism gates; RF and thermal scenarios.
- Fuzz binary parsers; property tests for TLV/CBOR; CRC/seq corruption tests.

## Interview checklist (senior)

- State workloads, latencies, and power targets early; quantify.
- Show ISR→task design, buffer sizes, and backpressure math.
- Prove C++ API choices (RAII, atomics, no hidden allocations) and testing strategy.
- Cover failure drills: sensor faults, thermal, link drops, OTA aborts.
