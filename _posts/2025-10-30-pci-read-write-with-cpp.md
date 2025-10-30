---
layout: post
title: "PCI Read/Write with C++ on Linux: Config Space and MMIO"
date: 2025-10-30 16:00:00 -0700
categories: cpp systems low-level
permalink: /2025/10/30/pci-read-write-with-cpp/
tags: [cpp, pci, mmio, drivers, linux, userspace, libpci]
---

# PCI Read/Write with C++ on Linux: Config Space and MMIO

This post shows how to access PCI device configuration space and memory-mapped I/O (BARs) from C++ on Linux. It uses the `pciutils` library (libpci) to enumerate devices and read/write config registers, and demonstrates mapping a BAR in user space for MMIO reads/writes.

Warning: User-space MMIO is powerful and dangerous. Only access devices you own; incorrect writes can hang the system. Prefer a kernel driver for production. Many devices require privileges; run as root for these examples.

## Prerequisites

```bash
sudo apt update
sudo apt install -y pciutils-dev pkg-config
```

Build with libpci:

```bash
g++ -std=c++17 pci_demo.cpp $(pkg-config --cflags --libs libpci) -o pci_demo
```

## Read PCI configuration space (vendor/device IDs, BARs)

```cpp
#include <pci/pci.h>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>

int main(int argc, char** argv) {
    const char* bdf = argc > 1 ? argv[1] : "0000:00:00.0"; // domain:bus:dev.func

    pci_access* pacc = pci_alloc();
    pci_init(pacc);
    pci_scan_bus(pacc);

    pci_dev* dev = nullptr;
    for (pci_dev* d = pacc->devices; d; d = d->next) {
        pci_fill_info(d, PCI_FILL_IDENT | PCI_FILL_BASES | PCI_FILL_CLASS);
        char name[64];
        snprintf(name, sizeof(name), "%04x:%02x:%02x.%d", d->domain, d->bus, d->dev, d->func);
        if (strcmp(name, bdf) == 0) { dev = d; break; }
    }
    if (!dev) {
        std::fprintf(stderr, "Device %s not found.\n", bdf);
        pci_cleanup(pacc);
        return 1;
    }

    uint16_t vendor = pci_read_word(dev, PCI_VENDOR_ID);
    uint16_t device = pci_read_word(dev, PCI_DEVICE_ID);
    std::printf("BDF %04x:%02x:%02x.%d vendor=0x%04x device=0x%04x\n",
                dev->domain, dev->bus, dev->dev, dev->func, vendor, device);

    // Example: read command/status register
    uint16_t cmd = pci_read_word(dev, PCI_COMMAND);
    uint16_t status = pci_read_word(dev, PCI_STATUS);
    std::printf("command=0x%04x status=0x%04x\n", cmd, status);

    // Example: enable bus mastering if not set (WRITE)
    if ((cmd & PCI_COMMAND_MASTER) == 0) {
        uint16_t newCmd = cmd | PCI_COMMAND_MASTER;
        pci_write_word(dev, PCI_COMMAND, newCmd);
        std::printf("Enabled bus mastering (0x%04x -> 0x%04x)\n", cmd, newCmd);
    }

    // List BARs
    for (int i = 0; i < 6; ++i) {
        uint32_t bar = pci_read_long(dev, PCI_BASE_ADDRESS_0 + 4*i);
        if (bar == 0) continue;
        bool isIo = bar & PCI_BASE_ADDRESS_SPACE_IO;
        if (isIo) {
            std::printf("BAR%d IO port base 0x%04x\n", i, bar & PCI_BASE_ADDRESS_IO_MASK);
        } else {
            std::printf("BAR%d MMIO base 0x%08x\n", i, bar & PCI_BASE_ADDRESS_MEM_MASK);
        }
    }

    pci_cleanup(pacc);
    return 0;
}
```

Explanation
- `pci_scan_bus` enumerates devices; we select one by BDF (domain:bus:device.function).
- `pci_read_word/long` read config space registers; `pci_write_*` writes them.
- The `PCI_COMMAND` register controls features like I/O, MMIO, and bus mastering.
- BARs (Base Address Registers) describe I/O port or MMIO regions exposed by the device.

## Map a BAR and perform MMIO read/write

On Linux, each device exposes resource files under `/sys/bus/pci/devices/0000:bb:dd.f/`. You can map a BAR via the `resourceN` file (N = BAR index):

```cpp
#include <fcntl.h>
#include <sys/mman.h>
#include <unistd.h>
#include <cstdint>
#include <cstdio>
#include <cerrno>

volatile uint32_t* map_bar(const char* bdf, int barIndex, size_t length, int& outFd) {
    char path[256];
    std::snprintf(path, sizeof(path), "/sys/bus/pci/devices/%s/resource%d", bdf, barIndex);
    int fd = ::open(path, O_RDWR | O_SYNC);
    if (fd < 0) { std::perror("open resource"); return nullptr; }
    void* base = ::mmap(nullptr, length, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (base == MAP_FAILED) { std::perror("mmap"); ::close(fd); return nullptr; }
    outFd = fd; return reinterpret_cast<volatile uint32_t*>(base);
}

int main(int argc, char** argv) {
    const char* bdf = argc > 1 ? argv[1] : "0000:01:00.0";
    int fd = -1;
    // Map first BAR for 4KB (adjust to your device’s register space)
    volatile uint32_t* regs = map_bar(bdf, /*BAR0*/0, 4096, fd);
    if (!regs) return 1;

    // Example register offsets
    constexpr off_t REG_STATUS = 0x00;
    constexpr off_t REG_CONTROL = 0x04;

    uint32_t status = regs[REG_STATUS/4];
    std::printf("status=0x%08x\n", status);

    // Write: set bit 0 in CONTROL
    uint32_t ctrl = regs[REG_CONTROL/4];
    ctrl |= 0x1;
    regs[REG_CONTROL/4] = ctrl;

    ::munmap(const_cast<uint32_t*>(reinterpret_cast<const uint32_t*>(regs)), 4096);
    ::close(fd);
    return 0;
}
```

Explanation
- We open `/sys/bus/pci/devices/<BDF>/resource0` and map it with `mmap` for read/write.
- MMIO registers are memory locations; reads/writes must be `volatile` to prevent reordering by the compiler.
- Register layout is device-specific; consult the datasheet for offsets and bit meanings.

## Safety, permissions, and alternatives

- Permissions: The `resourceN` files often require root. Consider udev rules for specific devices.
- Coherency: Some registers require read-backs or memory barriers; use `std::atomic_thread_fence(std::memory_order_seq_cst)` if needed.
- Concurrency: Avoid racing with a kernel driver. If a kernel driver is bound, do not map the same BAR from user space.
- Preferred approach: Write a minimal kernel driver exposing a char device or `sysfs`/`ioctl` interface; use `uio_pci_generic` for prototyping (UIO framework), then move to a proper driver.

## Quick checklist for interviews

- Enumerate with libpci; validate vendor/device ID.
- Read/interpret config space; enable MMIO/bus mastering via `PCI_COMMAND` when appropriate.
- Map BARs and access registers using `volatile` and correct endianness.
- Ensure privilege, isolation from kernel drivers, and proper error handling.


