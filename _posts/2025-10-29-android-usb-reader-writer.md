---
layout: post
title: "Android USB Reader/Writer: USB Host with Kotlin (CDC-ACM & Bulk)"
date: 2025-10-29 18:00:00 -0700
categories: android embedded systems
permalink: /2025/10/29/android-usb-reader-writer/
tags: [android, usb, usb-host, cdc-acm, bulk, kotlin]
---

# Android USB Reader/Writer: USB Host with Kotlin (CDC-ACM & Bulk)

This post shows how to talk to a USB device from Android using the USB Host API. We cover two common cases: CDC‑ACM serial devices and custom bulk endpoints. You will learn permission flow, opening interfaces, and reading/writing safely on background threads.

Requirements
- Android 6.0+ phone/tablet with USB‑OTG.
- `android.hardware.usb.host` feature and `uses-feature` declared.
- For CDC‑ACM, many devices will also work with libraries like `usb-serial-for-android`, but here we use the platform API to show the principles.

Manifest (USB Host + permission)

```xml
<manifest ...>
  <uses-feature android:name="android.hardware.usb.host" />
  <uses-permission android:name="android.permission.USB_PERMISSION" tools:ignore="NewApi" />

  <application ...>
    <receiver android:name=".usb.UsbPermissionReceiver">
      <intent-filter>
        <action android:name="com.example.USB_PERMISSION" />
      </intent-filter>
    </receiver>
  </application>
</manifest>
```

Requesting permission and opening the device

```kotlin
class UsbHelper(private val context: Context) {
  private val usb by lazy { context.getSystemService(Context.USB_SERVICE) as UsbManager }
  private val permissionAction = "com.example.USB_PERMISSION"

  fun findDevice(vid: Int, pid: Int): UsbDevice? =
    usb.deviceList.values.firstOrNull { it.vendorId == vid && it.productId == pid }

  fun requestPermission(device: UsbDevice, onResult: (Boolean) -> Unit) {
    val pi = PendingIntent.getBroadcast(
      context, 0, Intent(permissionAction), PendingIntent.FLAG_IMMUTABLE
    )
    val receiver = object : BroadcastReceiver() {
      override fun onReceive(c: Context?, i: Intent?) {
        context.unregisterReceiver(this)
        val granted = i?.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false) == true
        onResult(granted)
      }
    }
    context.registerReceiver(receiver, IntentFilter(permissionAction))
    usb.requestPermission(device, pi)
  }
}
```

Open interfaces/endpoints and start IO (bulk example)

```kotlin
data class UsbSession(
  val conn: UsbDeviceConnection,
  val intf: UsbInterface,
  val inEp: UsbEndpoint,
  val outEp: UsbEndpoint
)

fun openBulk(device: UsbDevice, manager: UsbManager): UsbSession? {
  val intf = (0 until device.interfaceCount)
    .map { device.getInterface(it) }
    .firstOrNull { it.interfaceClass == UsbConstants.USB_CLASS_VENDOR_SPEC || it.interfaceClass == UsbConstants.USB_CLASS_COMM }
    ?: return null
  val eps = (0 until intf.endpointCount).map { intf.getEndpoint(it) }
  val inEp = eps.firstOrNull { it.direction == UsbConstants.USB_DIR_IN && it.type == UsbConstants.USB_ENDPOINT_XFER_BULK } ?: return null
  val outEp = eps.firstOrNull { it.direction == UsbConstants.USB_DIR_OUT && it.type == UsbConstants.USB_ENDPOINT_XFER_BULK } ?: return null

  val conn = manager.openDevice(device) ?: return null
  if (!conn.claimInterface(intf, true)) { conn.close(); return null }
  return UsbSession(conn, intf, inEp, outEp)
}

class UsbIo(private val session: UsbSession) {
  @Volatile private var running = true

  fun startReader(onData: (ByteArray) -> Unit) = thread(name = "usb-reader") {
    val buf = ByteArray(512)
    while (running) {
      val n = session.conn.bulkTransfer(session.inEp, buf, buf.size, 1000)
      if (n != null && n > 0) onData(buf.copyOf(n))
    }
  }

  fun write(data: ByteArray, timeoutMs: Int = 1000): Int =
    session.conn.bulkTransfer(session.outEp, data, data.size, timeoutMs) ?: -1

  fun close() {
    running = false
    session.conn.releaseInterface(session.intf)
    session.conn.close()
  }
}
```

CDC‑ACM (serial‑like) setup

CDC‑ACM exposes a control interface and a data interface with bulk IN/OUT endpoints. You must set line coding and control signals via control transfers.

```kotlin
fun setupCdcAcm(conn: UsbDeviceConnection, controlIntf: UsbInterface) {
  val SET_LINE_CODING = 0x20
  val SET_CONTROL_LINE_STATE = 0x22
  // 115200 8N1 line coding: dwDTERate(115200), bCharFormat(0=1stop), bParityType(0), bDataBits(8)
  val line = byteArrayOf(0x00, 0xc2.toByte(), 0x01, 0x00, 0x00, 0x00, 0x08)
  conn.controlTransfer(0x21, SET_LINE_CODING, 0, controlIntf.id, line, line.size, 1000)
  // DTR(1) | RTS(2)
  conn.controlTransfer(0x21, SET_CONTROL_LINE_STATE, 0x0003, controlIntf.id, null, 0, 1000)
}

fun openCdc(device: UsbDevice, manager: UsbManager): UsbSession? {
  // Typically intf0: control (class COMM), intf1: data (class CDC_DATA)
  val ctrl = (0 until device.interfaceCount).map { device.getInterface(it) }
    .firstOrNull { it.interfaceClass == UsbConstants.USB_CLASS_COMM } ?: return null
  val data = (0 until device.interfaceCount).map { device.getInterface(it) }
    .firstOrNull { it.interfaceClass == UsbConstants.USB_CLASS_CDC_DATA } ?: return null
  val inEp = (0 until data.endpointCount).map { data.getEndpoint(it) }
    .first { it.direction == UsbConstants.USB_DIR_IN && it.type == UsbConstants.USB_ENDPOINT_XFER_BULK }
  val outEp = (0 until data.endpointCount).map { data.getEndpoint(it) }
    .first { it.direction == UsbConstants.USB_DIR_OUT && it.type == UsbConstants.USB_ENDPOINT_XFER_BULK }

  val conn = manager.openDevice(device) ?: return null
  if (!conn.claimInterface(ctrl, true) || !conn.claimInterface(data, true)) { conn.close(); return null }
  setupCdcAcm(conn, ctrl)
  return UsbSession(conn, data, inEp, outEp)
}
```

Usage flow
1) Find device by VID/PID via `UsbManager.deviceList`.
2) Request permission (broadcast receiver).
3) Open and claim interface(s), locate endpoints.
4) Start a background reader thread, write with `bulkTransfer`.
5) On lifecycle end, release interface and close connection.

Tips
- Use a dedicated `HandlerThread`/`CoroutineScope(Dispatchers.IO)` instead of raw threads in apps.
- For high throughput, prefer larger buffers and continuous reads; consider `UsbRequest` queue API for zero‑copy.
- On Android 12+, exported receivers require `android:exported` in the manifest.
- If a kernel driver claims CDC‑ACM, Android’s USB host still exposes it to apps; permission is always required.

Troubleshooting
- If `bulkTransfer` returns -1 quickly, check endpoint direction/type and timeouts.
- If permission dialog doesn’t appear, verify action string matches in broadcast/manifest.
- Some devices need an OTG adapter or external power; check logs with `adb logcat`. 
