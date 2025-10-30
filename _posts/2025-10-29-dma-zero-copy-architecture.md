---
layout: post
title: "DMA and Zero-Copy Architecture: High-Throughput Embedded C++"
date: 2025-10-29 22:55:00 -0700
categories: embedded performance dma
permalink: /2025/10/29/dma-zero-copy-architecture/
tags: [dma, zero-copy, throughput, cache, ahardwarebuffer]
---

# DMA and Zero-Copy Architecture

Patterns for moving data with minimal CPU overhead on MCUs and Android.

## MCU: double-buffered DMA

```c
volatile uint8_t bufA[2048], bufB[2048];
volatile bool aReady=false, bReady=false;

void dma_isr() {
  if (DMA_CH->ISR & DONE_A) { aReady = true; /* switch to B */ }
  if (DMA_CH->ISR & DONE_B) { bReady = true; /* switch to A */ }
}
```

Process in task while DMA fills the other buffer; pin buffers to non‑cacheable or manage cache clean/invalidate.

## Android: AHardwareBuffer zero‑copy

```cpp
// Producer writes into AHB; consumer reads without extra copies
AHardwareBuffer* ahb;
AHardwareBuffer_Desc d{.width=w,.height=h,.layers=1,.format=AHARDWAREBUFFER_FORMAT_R8G8B8A8_UNORM,.usage=AHARDWAREBUFFER_USAGE_GPU_SAMPLED_IMAGE|AHARDWAREBUFFER_USAGE_CPU_READ_OFTEN};
AHardwareBuffer_allocate(&d, &ahb);
```

## Cache coherency

- Beware D‑cache on DMA; use clean/invalidate or non‑cacheable regions; align to cache lines.
