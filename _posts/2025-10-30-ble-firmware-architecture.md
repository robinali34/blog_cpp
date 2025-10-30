---
layout: post
title: "BLE Firmware Architecture: GATT, MTU, Throughput, and OTA"
date: 2025-10-30 22:40:00 -0700
categories: embedded ble iot
permalink: /2025/10/30/ble-firmware-architecture/
tags: [ble, gatt, mtu, throughput, ota, pairing]
---

# BLE Firmware Architecture

Patterns for building a robust BLE peripheral: services, MTU/conn param tuning, throughput math, and OTA.

## GATT layout

- DATA_NOTIFY (notify, 20–185 bytes/notify)
- CMD_WRITE (write w/o response)
- STATUS_READ (read)

## Throughput estimate

`throughput ≈ (payload_per_notify * notifies_per_interval) / conn_interval`

With MTU 185, 4 notifies/15 ms → ~49 KB/s.

## Chunked transfer

```cpp
struct ChunkHdr { uint16_t seq; uint16_t total; uint16_t len; };
// Application splits payload into MTU-sized chunks with header; reassemble on host.
```

## OTA over GATT

- Use write without response; windowed acks every N chunks; CRC per block.
- Persist state (offset, block crc) for resume after power loss.

