---
layout: post
title: "Secure Bootloader and OTA: A/B Slots, Signatures, and Rollback"
date: 2025-10-30 22:35:00 -0700
categories: embedded security ota
permalink: /2025/10/30/bootloader-ota-secure/
tags: [bootloader, ota, signatures, rollback, a-b, flash]
---

# Secure Bootloader and OTA

Designing an A/B bootloader with signed updates and robust rollback.

## Boot flow

```
ROM → Bootloader → Verify active slot (A/B) → Jump to app
                  ↘ Update flow (verify new image, mark pending)
```

## Image manifest

```c
typedef struct __attribute__((packed)) {
  uint32_t magic;
  uint32_t version;
  uint32_t size;
  uint8_t  hash[32]; // SHA-256
  uint8_t  sig[64];  // Ed25519
} image_hdr_t;
```

## Verify then switch

```c
bool verify_image(const image_hdr_t* h, const uint8_t* image) {
  uint8_t calc[32]; sha256(image, h->size, calc);
  if (memcmp(calc, h->hash, 32) != 0) return false;
  return ed25519_verify(h->sig, h->hash, 32, pubkey);
}
```

Rules
- Never execute unverified images.
- Mark new slot "pending"; only commit after app sets healthy flag N times.
- Keep watchdog during update; power‑loss safe writes (copy‑on‑write pages).


