---
layout: post
title: "Matter (CHIP) with C++: Intro and Practical Examples"
date: 2025-10-29 14:00:00 -0700
categories: iot matter embedded
permalink: /2025/10/29/matter-with-cpp-intro-and-examples/
tags: [iot, matter, chip, embedded, bluetooth, wifi, thread, commissioning, clusters]
---

# Matter (CHIP) with C++: Intro and Practical Examples

This post introduces Matter (formerly Project CHIP) and shows how to use C++ to build and control simple Matter devices using the official SDK. You will see commissioning basics and a minimal On/Off cluster example to turn a device (e.g., light) on and off.

## What is Matter?

Matter is an open smart‑home standard from the Connectivity Standards Alliance, unifying device models, security, and commissioning across ecosystems (Apple Home, Google Home, Amazon Alexa, etc.). Key points:
- Interoperability: shared data model (clusters/attributes/commands) across vendors.
- Security‑first: certificate‑based attestation (Device Attestation, PASE/CASE), per‑fabric secrets, operational certificates.
- Multiple transports: Ethernet/Wi‑Fi/Thread for operational traffic; BLE for commissioning.
- Local control by design: controllers interact directly with devices on local network.

Core concepts:
- Fabric: a trust domain (controller + its commissioned devices).
- Endpoint: logical device on a node (e.g., endpoint 1 = light, 2 = sensor).
- Cluster: standardized feature set (e.g., OnOff, LevelControl, OccupancySensing), with attributes and commands.

## Getting the C++ SDK

The reference SDK is open source (Apache 2.0). It includes device and controller libraries, examples, and build files for Linux/macOS/Embedded.

Build prerequisites (Linux):

```bash
sudo apt update
sudo apt install -y git build-essential ninja-build clang lldb python3 python3-venv libavahi-compat-libdnssd-dev libdbus-1-dev
git clone https://github.com/project-chip/connectedhomeip.git
cd connectedhomeip
./scripts/checkout_submodules.py --shallow --platform linux
source scripts/activate.sh
gn gen out/host
ninja -C out/host
```

Common example targets: `chip-tool` (controller CLI), `all-clusters-app` (device emulator), `lighting-app` (device emulator with On/Off/Level).

## Quick try: control a simulated light

Terminal 1 – start a device app (advertises over mDNS):

```bash
./out/host/examples/lighting-app/linux/lighting-app --ble-device 0
```

Terminal 2 – use controller CLI to commission and send commands (PASE via BLE, then operational over IP):

```bash
# Commission (assumes default discriminator and setup PIN)
./out/host/chip-tool pairing ble-wifi 0x1234 SSID PASSKEY 20202021 3840

# Toggle OnOff cluster on endpoint 1
./out/host/chip-tool onoff on  0x1234 1
./out/host/chip-tool onoff off 0x1234 1
```

If both run on one host, `0x1234` is the node id assigned during pairing. Replace with your node id when using real hardware.

## Minimal C++ device: On/Off endpoint

Below is a trimmed device application sketch in C++ using the SDK. It advertises a node with a single On/Off endpoint and handles on/off commands.

```cpp
#include <app/CommandHandler.h>
#include <app/server/Server.h>
#include <app/util/attribute-storage.h>
#include <lib/support/CHIPMem.h>

using namespace chip;
using namespace chip::app;

// Attribute storage is generated from ZAP, here we assume OnOff cluster is present on endpoint 1

static void SetOnOff(AttributeValueEncoder::ValueEncoder & encoder, bool value) {
    // Persist to attribute storage (simplified)
    // In a real app, use emberAfWriteServerAttribute(...) or GeneratedAttributeAccessInterface
}

class OnOffCommandHandler : public CommandHandler::Callback {
public:
    void OnDone(CommandHandler & commandObj) override {}

    Protocols::InteractionModel::Status CommandDispatch(CommandHandler & handler,
                                                        const ConcreteCommandPath & path,
                                                        TLV::TLVReader & reader) override {
        if (path.mClusterId == Clusters::OnOff::Id) {
            switch (path.mCommandId) {
                case Clusters::OnOff::Commands::On::Id:
                    // drive GPIO/LED on
                    // set attribute value to true
                    handler.AddStatus(path, Protocols::InteractionModel::Status::Success);
                    return Protocols::InteractionModel::Status::Success;
                case Clusters::OnOff::Commands::Off::Id:
                    // drive GPIO/LED off
                    handler.AddStatus(path, Protocols::InteractionModel::Status::Success);
                    return Protocols::InteractionModel::Status::Success;
            }
        }
        return Protocols::InteractionModel::Status::UnsupportedCommand;
    }
};

int main() {
    chip::Platform::MemoryInit();
    OnOffCommandHandler onoffHandler;
    chip::app::Server::GetInstance().Init();

    // Register handler (pseudo; actual registration differs if using generated code)
    // CommandHandler::GetInstance().RegisterCallback(&onoffHandler);

    chip::app::Server::GetInstance().StartServer();
    // Run the event loop
    chip::DeviceLayer::PlatformMgr().RunEventLoop();
    return 0;
}
```

Notes
- Real projects generate cluster code via ZAP (ZCL Advanced Platform) definitions. Generation produces attribute accessors and dispatch tables; you implement hooks to drive hardware (GPIO/PWM).
- For MCUs (e.g., nRF/ESP32), use the corresponding example app and board layer; the logic above maps to platform callbacks.

## Minimal C++ controller: toggle On/Off

Using the controller stack, a C++ snippet to send an On command after resolving the node:

```cpp
#include <controller/CHIPDeviceController.h>
#include <app/clusters/on-off-client/on-off-cluster.h>

using namespace chip;

void Toggle(NodeId node, EndpointId ep) {
    Controller::DeviceController controller;
    // Assume controller is already commissioned and has fabric credentials
    // Resolve and establish CASE session
    auto * exchangeMgr = controller.GetExchangeManager();
    Clusters::OnOff::Commands::On::Type onCmd;
    // Send command
    Controller::InvokeCommandRequest request(node, ep, Clusters::OnOff::Id, Clusters::OnOff::Commands::On::Id, onCmd);
    controller.SendCommand(request, [](Protocols::InteractionModel::Status st) {
        // handle status
    });
}
```

In practice, most teams script with `chip-tool` or write Kotlin/Swift apps that talk to a Matter controller service, but the C++ controller API is available for gateways/bridges.

## Commissioning overview

Commissioning stages:
1. Discovery: mDNS (DNS‑SD) or BLE advertisement.
2. PASE session establishment using setup code (PIN) and discriminator.
3. Device Attestation: verify vendor cert chain.
4. Operational credentials: install NOC and add to fabric.
5. Operational: communicate over IP (Wi‑Fi/Ethernet/Thread).

Security tips
- Keep setup payloads protected; rotate when possible.
- Validate attestation; reject uncertified devices.
- Restrict fabrics; remove when controllers are decommissioned.

## Troubleshooting tips

- If commands time out, verify fabric and CASE session; check mDNS entries and firewall.
- BLE commissioning issues: ensure correct discriminator and that device is in pairing mode.
- For Thread devices, verify border router is up and device got an IPv6 address.

## References

- Matter SDK repo: https://github.com/project-chip/connectedhomeip
- CSA Matter spec: https://csa-iot.org/all-solutions/matter/
- chip-tool usage: search "connectedhomeip chip-tool" in the SDK docs/examples
