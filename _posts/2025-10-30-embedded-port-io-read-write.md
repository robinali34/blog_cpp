---
layout: post
title: "Embedded Port I/O Read/Write: uint8_t/uint16_t/uint32_t and More"
date: 2025-10-30 19:00:00 -0700
categories: embedded systems low-level
permalink: /2025/10/30/embedded-port-io-read-write/
tags: [embedded, mmio, registers, volatile, endianness, memory-barriers, alignment]
---

# Embedded Port I/O Read/Write: uint8_t/uint16_t/uint32_t and More

This guide shows safe patterns to read and write hardware registers (MMIO) for byte/halfword/word widths. It also covers endianness, alignment, memory barriers, and bit operations.

## Core MMIO helpers (C/C++)

```cpp
#include <cstdint>

static inline void write8(uintptr_t addr, uint8_t v) {
    *reinterpret_cast<volatile uint8_t*>(addr) = v;
}

static inline uint8_t read8(uintptr_t addr) {
    return *reinterpret_cast<volatile const uint8_t*>(addr);
}

static inline void write16(uintptr_t addr, uint16_t v) {
    *reinterpret_cast<volatile uint16_t*>(addr) = v;
}

static inline uint16_t read16(uintptr_t addr) {
    return *reinterpret_cast<volatile const uint16_t*>(addr);
}

static inline void write32(uintptr_t addr, uint32_t v) {
    *reinterpret_cast<volatile uint32_t*>(addr) = v;
}

static inline uint32_t read32(uintptr_t addr) {
    return *reinterpret_cast<volatile const uint32_t*>(addr);
}
```

Notes
- `volatile` prevents the compiler from reordering or eliding register accesses.
- Use the exact width that the IP specifies; some peripherals require aligned, native-width accesses.

## Memory barriers (ordering)

On ARM (CMSIS), use data/instruction barriers when required by your SoC/peripheral:

```cpp
#if defined(__ARM_ARCH)
  #include <cmsis_gcc.h> // or relevant CMSIS header
  static inline void mb()  { __DMB(); }
  static inline void wmb() { __DSB(); }
  static inline void rmb() { __DMB(); }
#else
  static inline void mb()  { asm volatile(""); }
  static inline void wmb() { asm volatile(""); }
  static inline void rmb() { asm volatile(""); }
#endif
```

Typical usage: write registers then `wmb()` before starting the peripheral; or `mb()` after polling a status bit before reading a data register.

## Endianness helpers

If the peripheral/descriptor is little‑endian on a big‑endian CPU (or vice versa), swap:

```cpp
static inline uint16_t bswap16(uint16_t x) { return (x>>8) | (x<<8); }
static inline uint32_t bswap32(uint32_t x) {
    return ((x & 0x000000FFu) << 24) |
           ((x & 0x0000FF00u) << 8)  |
           ((x & 0x00FF0000u) >> 8)  |
           ((x & 0xFF000000u) >> 24);
}

// Example: read little-endian 32-bit value regardless of host endianness
static inline uint32_t read32_le(uintptr_t addr) {
    uint32_t v = read32(addr);
#if __BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__
    return v;
#else
    return bswap32(v);
#endif
}
```

## Bit operations (set/clear/toggle/mask)

```cpp
static inline void set_bits32(uintptr_t addr, uint32_t mask) {
    write32(addr, read32(addr) | mask);
}
static inline void clr_bits32(uintptr_t addr, uint32_t mask) {
    write32(addr, read32(addr) & ~mask);
}
static inline void upd_bits32(uintptr_t addr, uint32_t mask, uint32_t value) {
    uint32_t v = read32(addr);
    v = (v & ~mask) | (value & mask);
    write32(addr, v);
}
```

For 8/16‑bit registers, use `read8`/`write8` or `read16`/`write16` with matching masks.

## Packed structs (register blocks)

Define a header that matches the IP register layout. Use `volatile` and correct widths; avoid unaligned fields.

```cpp
struct GpioRegs {
    volatile uint32_t MODER;    // 0x00 mode
    volatile uint32_t OTYPER;   // 0x04 output type
    volatile uint32_t OSPEEDR;  // 0x08 speed
    volatile uint32_t PUPDR;    // 0x0C pull-up/down
    volatile uint32_t IDR;      // 0x10 input data
    volatile uint32_t ODR;      // 0x14 output data
    volatile uint32_t BSRR;     // 0x18 bit set/reset
    // ...
};

static inline GpioRegs* gpio(uintptr_t base) {
    return reinterpret_cast<GpioRegs*>(base);
}

// Example: set pin 5 high using BSRR
static inline void gpio_set_pin(uintptr_t base, uint32_t pin) {
    gpio(base)->BSRR = (1u << pin);
}
```

## Alignment and atomicity

- Many MCUs require aligned 16/32‑bit accesses; unaligned writes may bus‑fault.
- Some status registers are write‑1‑to‑clear (W1C); never read‑modify‑write blindly. Use documented write semantics.
- For multi‑producer/consumer between ISR and main, guard shared registers/buffers or use atomic/disable IRQ sections as needed.

## Example: UART write with polling

```cpp
namespace UART {
    static constexpr uintptr_t BASE = 0x40011000u; // example
    static constexpr uintptr_t DR   = BASE + 0x00; // data
    static constexpr uintptr_t SR   = BASE + 0x04; // status
    static constexpr uint32_t   TXE  = (1u << 7);  // transmit empty

    static inline void putc(uint8_t ch) {
        while ((read32(SR) & TXE) == 0) { /* spin */ }
        write8(DR, ch);
    }
}
```

## Example: GPIO direction and value (8/16/32 widths)

```cpp
// Assume 8-bit direction register and 8-bit data register
static constexpr uintptr_t GPIO_DIR8 = 0x50000000u;
static constexpr uintptr_t GPIO_OUT8 = 0x50000004u;

void gpio_make_output8(unsigned pin) { set_bits32(GPIO_DIR8, (1u << pin)); }
void gpio_write8(unsigned pin, bool high) {
    uint8_t v = read8(GPIO_OUT8);
    v = high ? (uint8_t)(v |  (1u << pin))
             : (uint8_t)(v & ~(1u << pin));
    write8(GPIO_OUT8, v);
}

// 16-bit variant
static constexpr uintptr_t GPIO_DIR16 = 0x50000100u;
static constexpr uintptr_t GPIO_OUT16 = 0x50000104u;

void gpio_make_output16(unsigned pin) { write16(GPIO_DIR16, read16(GPIO_DIR16) | (uint16_t)(1u << pin)); }
void gpio_write16(unsigned pin, bool high) {
    uint16_t v = read16(GPIO_OUT16);
    v = high ? (uint16_t)(v |  (1u << pin))
             : (uint16_t)(v & ~(1u << pin));
    write16(GPIO_OUT16, v);
}

// 32-bit variant
static constexpr uintptr_t GPIO_DIR32 = 0x50000200u;
static constexpr uintptr_t GPIO_OUT32 = 0x50000204u;

void gpio_make_output32(unsigned pin) { write32(GPIO_DIR32, read32(GPIO_DIR32) | (1u << pin)); }
void gpio_write32(unsigned pin, bool high) {
    uint32_t v = read32(GPIO_OUT32);
    v = high ? (v |  (1u << pin))
             : (v & ~(1u << pin));
    write32(GPIO_OUT32, v);
}
```

## Checklist for interviews

- Use `volatile` on MMIO and respect documented access widths.
- Consider ordering (barriers) and W1C semantics; avoid unsafe read‑modify‑write.
- Handle endianness and alignment explicitly.
- Prefer register block structs for clarity; keep addresses/types central.
- Isolate ISR vs. main access; use atomics/critical sections if shared.


