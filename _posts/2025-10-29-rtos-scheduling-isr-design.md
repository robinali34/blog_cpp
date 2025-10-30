---
layout: post
title: "RTOS Scheduling and ISR Design: Queues, Priorities, and Backpressure"
date: 2025-10-29 22:30:00 -0700
categories: embedded rtos concurrency
permalink: /2025/10/29/rtos-scheduling-isr-design/
tags: [rtos, isr, dma, concurrency, queues, backpressure]
---

# RTOS Scheduling and ISR Design

A senior‑level look at structuring ISR→task pipelines, selecting priorities, and handling backpressure.

## Golden rules

- Keep ISRs short; defer work to tasks via queues/ring buffers.
- One producer, one consumer per ring when possible; avoid locks in ISRs.
- Prioritize by criticality: data capture > control loops > telemetry > UI.

## Lock‑free ring buffer (ISR→task)

```cpp
struct Ring {
  alignas(4) uint8_t buf[4096];
  std::atomic<uint16_t> head{0}, tail{0};
};

inline bool push_isr(Ring& r, std::span<const uint8_t> pkt) {
  uint16_t h = r.head.load(std::memory_order_relaxed);
  uint16_t t = r.tail.load(std::memory_order_acquire);
  uint16_t free = uint16_t(sizeof(r.buf) - (uint16_t)(h - t));
  if (free < pkt.size()) return false; // drop
  for (uint8_t b : pkt) r.buf[h++ % sizeof(r.buf)] = b;
  r.head.store(h, std::memory_order_release);
  return true;
}

inline size_t pop_task(Ring& r, std::span<uint8_t> out) {
  uint16_t t = r.tail.load(std::memory_order_relaxed);
  uint16_t h = r.head.load(std::memory_order_acquire);
  size_t n = std::min((size_t)(h - t), out.size());
  for (size_t i = 0; i < n; ++i) out[i] = r.buf[(t + i) % sizeof(r.buf)];
  r.tail.store(t + (uint16_t)n, std::memory_order_release);
  return n;
}
```

## Priority mapping

- ISR: highest by hardware.
- Task priorities: `capture > control > comms > storage > ui`.

## Backpressure strategies

- Drop newest non‑critical packets; keep metadata.
- Signal rate reducer upstream (lower sample rate or MTU).
- Telemetry summarization when congested.
