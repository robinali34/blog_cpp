---
layout: post
title: "USB Reader/Writer with C++ (Embedded): CDC-ACM and libusb Bulk"
date: 2025-10-30 17:00:00 -0700
categories: cpp systems embedded
permalink: /2025/10/30/usb-reader-writer-embedded-cpp/
tags: [cpp, usb, embedded, cdc-acm, libusb, serial, bulk-transfer]
---

# USB Reader/Writer with C++ (Embedded): CDC-ACM and libusb Bulk

Two pragmatic ways to exchange data with a USB device from C++ on Linux:
1) USB CDC-ACM (appears as `/dev/ttyACM*`/`/dev/ttyUSB*`) using POSIX `termios`.
2) Raw USB via `libusb` for bulk endpoints (common for custom devices).

CDC-ACM is ideal for quick logs/commands. Use libusb when you control endpoints and need throughput or custom protocols.

## 1) CDC-ACM serial: read/write `/dev/ttyACM0`

```cpp
#include <termios.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstring>
#include <cstdio>
#include <string>

int openSerial(const char* path, speed_t baud) {
    int fd = ::open(path, O_RDWR | O_NOCTTY | O_SYNC);
    if (fd < 0) { std::perror("open"); return -1; }
    termios tio{};
    if (tcgetattr(fd, &tio) != 0) { std::perror("tcgetattr"); ::close(fd); return -1; }

    cfmakeraw(&tio);
    cfsetispeed(&tio, baud);
    cfsetospeed(&tio, baud);
    tio.c_cflag |= (CLOCAL | CREAD);
    tio.c_cflag &= ~CSTOPB;    // 1 stop bit
    tio.c_cflag &= ~PARENB;    // no parity
    tio.c_cflag &= ~CRTSCTS;   // no HW flow
    tio.c_cc[VMIN]  = 0;       // non-blocking read
    tio.c_cc[VTIME] = 1;       // read timeout = 0.1s

    if (tcsetattr(fd, TCSANOW, &tio) != 0) { std::perror("tcsetattr"); ::close(fd); return -1; }
    return fd;
}

int main() {
    const char* dev = "/dev/ttyACM0"; // or /dev/ttyUSB0
    int fd = openSerial(dev, B115200);
    if (fd < 0) return 1;

    // Write a command
    const char* cmd = "PING\n";
    if (::write(fd, cmd, std::strlen(cmd)) < 0) std::perror("write");

    // Read response (non-blocking, simple loop)
    char buf[256];
    std::string acc;
    for (int i = 0; i < 50; ++i) {
        int n = ::read(fd, buf, sizeof(buf));
        if (n > 0) acc.append(buf, buf + n);
        usleep(20'000);
    }
    std::printf("Response: %s\n", acc.c_str());

    ::close(fd);
    return 0;
}
```

Build:

```bash
g++ -std=c++17 serial_demo.cpp -o serial_demo
```

Notes
- Ensure udev permissions (or run as root). For stable paths, create udev rules matching VID/PID.
- Device firmware should set CDC line coding (115200 8N1) or ignore it.

## 2) libusb bulk transfer: custom endpoints

```cpp
#include <libusb-1.0/libusb.h>
#include <cstdio>
#include <vector>

struct UsbDev { libusb_device_handle* h = nullptr; uint8_t inEp = 0x81; uint8_t outEp = 0x01; };

bool openDevice(uint16_t vid, uint16_t pid, UsbDev& dev) {
    if (libusb_init(nullptr) != 0) return false;
    dev.h = libusb_open_device_with_vid_pid(nullptr, vid, pid);
    if (!dev.h) return false;
    libusb_set_auto_detach_kernel_driver(dev.h, 1);
    if (libusb_claim_interface(dev.h, 0) != 0) return false;
    // Optionally scan descriptors to find bulk endpoints
    return true;
}

int main() {
    UsbDev d;
    uint16_t vid = 0x1234, pid = 0x5678; // replace with your device
    if (!openDevice(vid, pid, d)) { std::fprintf(stderr, "open failed\n"); return 1; }

    // Write bulk OUT
    const unsigned char tx[] = { 'H','e','l','l','o' };
    int wrote = 0;
    int rc = libusb_bulk_transfer(d.h, d.outEp, const_cast<unsigned char*>(tx), sizeof(tx), &wrote, 1000);
    if (rc != 0) std::fprintf(stderr, "bulk out err %d\n", rc);

    // Read bulk IN
    unsigned char rx[512]; int got = 0;
    rc = libusb_bulk_transfer(d.h, d.inEp, rx, sizeof(rx), &got, 1000);
    if (rc == 0) std::printf("got %d bytes\n", got);

    libusb_release_interface(d.h, 0);
    libusb_close(d.h);
    libusb_exit(nullptr);
    return 0;
}
```

Build:

```bash
g++ -std=c++17 bulk_demo.cpp -lusb-1.0 -o bulk_demo
```

Finding endpoints
- Inspect with `lsusb -v -d vid:pid` and look for Bulk IN/OUT endpoint addresses (e.g., `0x81` IN, `0x01` OUT).
- Alternatively, enumerate configurations/interfaces/endpoints at runtime and pick the first bulk pair.

Throughput tips
- Use large transfers (up to 16–64 KB) and queue multiple in parallel (libusb async API) for higher throughput.
- Avoid small packet sizes in hot loops; amortize syscalls.

Safety
- If a kernel driver (e.g., `cdc_acm`) owns the interface, either use CDC-ACM path or auto-detach (`libusb_set_auto_detach_kernel_driver`). Don’t race the same interface with two drivers.


