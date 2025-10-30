---
layout: post
title: "MQTT: How It Works and C++ Usage"
date: 2025-10-29 00:00:00 -0700
categories: cpp mqtt iot networking
permalink: /2025/10/29/mqtt-how-it-works-and-cpp-guide/
tags: [mqtt, iot, paho, mosquitto, qos, tls, cpp]
---

# MQTT: How It Works and C++ Usage

A lightweight pub/sub protocol for IoT and backend messaging. This guide explains MQTT concepts (topics, QoS, sessions, retain, wills) and shows how to use it from C++ with Eclipse Paho and libmosquitto.

## MQTT Fundamentals (Quick Primer)

- **Broker**: central server routing messages (e.g., Mosquitto, EMQX, HiveMQ)
- **Client roles**:
  - Publish: send messages to a topic
  - Subscribe: receive messages for matching topics
- **Topics**: hierarchical strings (`sensors/cam/1`), wildcards `+` (single), `#` (multi)
- **QoS levels**:
  - 0: at most once (fire‑and‑forget)
  - 1: at least once (PUBACK) — may duplicate
  - 2: exactly once (four‑way handshake)
- **Retained message**: broker stores the last message per topic; delivered immediately to new subscribers
- **Session & Clean Start**:
  - v3.1.1: `cleanSession` flag; v5: `clean start` + session expiry
  - Durable session preserves pending QoS1/2 messages & subscriptions
- **Last Will and Testament (LWT)**: broker publishes on behalf of a dead client
- **Keep Alive**: ping to detect dead connections

## Security (TLS, Auth)

- TLS with server verification (CA), client certs if needed
- Username/password or token‑based auth
- ALPN/SNI may be required on hosted brokers

---

## Using Eclipse Paho C++ (synchronous)

Install: `apt install libpaho-mqttpp3-dev libpaho-mqtt3a-dev` (Linux)

```cpp
// g++ -std=c++20 -lpaho-mqttpp3 -lpaho-mqtt3a paho_sync.cpp -o paho_sync
#include <mqtt/client.h>
#include <iostream>

int main(){
    const std::string broker = "tcp://localhost:1883";
    const std::string clientId = "cpp-sync-1";
    mqtt::client cli(broker, clientId);

    // Connection options
    mqtt::connect_options conn;
    conn.set_clean_session(true);

    // Last Will
    mqtt::message will("status/clients/cpp-sync-1", "offline", 1, true);
    conn.set_will(will);

    // Connect
    cli.connect(conn);

    // Subscribe
    cli.subscribe("demo/hello", 1);

    // Publish
    auto msg = mqtt::make_message("demo/hello", "hello from paho");
    msg->set_qos(1);
    cli.publish(msg);

    // Receive (blocking sample)
    auto tok = cli.start_consuming();
    auto msgIn = cli.consume_message();
    if (msgIn) std::cout << msgIn->get_topic() << ": " << msgIn->to_string() << "\n";

    // Disconnect
    cli.stop_consuming();
    cli.disconnect();
}
```

### TLS with Paho

```cpp
mqtt::ssl_options ssl;
ssl.set_trust_store("/etc/ssl/certs/ca-certificates.crt");
// ssl.set_key_store("client.crt"); ssl.set_private_key("client.key");
conn.set_ssl(ssl);
```

---

## Using Eclipse Paho C++ (asynchronous)

```cpp
// g++ -std=c++20 -lpaho-mqttpp3 -lpaho-mqtt3as paho_async.cpp -o paho_async
#include <mqtt/async_client.h>
#include <iostream>

struct callback : public mqtt::callback, public mqtt::iaction_listener {
    void connected(const std::string&) override { std::cout << "connected\n"; }
    void connection_lost(const std::string& cause) override { std::cout << "lost: " << cause << "\n"; }
    void message_arrived(mqtt::const_message_ptr msg) override {
        std::cout << msg->get_topic() << ": " << msg->to_string() << "\n";
    }
    void delivery_complete(mqtt::delivery_token_ptr) override {}
    void on_success(const mqtt::token&) override {}
    void on_failure(const mqtt::token&) override { std::cout << "op failed\n"; }
};

int main(){
    mqtt::async_client cli("tcp://localhost:1883", "cpp-async-1");
    callback cb; cli.set_callback(cb);

    mqtt::connect_options conn; conn.set_clean_session(true);
    cli.connect(conn)->wait();
    cli.subscribe("demo/#", 1)->wait();
    cli.publish("demo/hello", "hi", 2, false);

    std::this_thread::sleep_for(std::chrono::seconds(2));
    cli.disconnect()->wait();
}
```

---

## Using libmosquitto (C API usable from C++)

Install: `apt install libmosquitto-dev`

```cpp
// g++ -std=c++20 -lmosquitto mosq_basic.cpp -o mosq_basic
#include <mosquitto.h>
#include <cstring>
#include <iostream>

void on_connect(struct mosquitto*, void*, int rc){ std::cout << "connect rc=" << rc << "\n"; }
void on_message(struct mosquitto*, void*, const struct mosquitto_message* m){
    std::cout << m->topic << ": " << std::string((char*)m->payload, m->payloadlen) << "\n";
}

int main(){
    mosquitto_lib_init();
    mosquitto* m = mosquitto_new("cpp-mosq-1", true, nullptr);
    mosquitto_connect_callback_set(m, on_connect);
    mosquitto_message_callback_set(m, on_message);

    mosquitto_username_pw_set(m, "user", "pass");
    // TLS: mosquitto_tls_set(m, ca, nullptr, cert, key, nullptr);

    if (mosquitto_connect(m, "localhost", 1883, 60) != MOSQ_ERR_SUCCESS) return 1;
    mosquitto_subscribe(m, nullptr, "demo/#", 1);
    mosquitto_publish(m, nullptr, "demo/hello", 5, "hello", 1, false);

    for(;;){ mosquitto_loop(m, -1, 1); }

    mosquitto_destroy(m); mosquitto_lib_cleanup();
}
```

---

## MQTT v5 Features (brief)

- Reason codes & user properties
- Session expiry & enhanced flow control
- Negative acks, topic aliases

Paho supports MQTT v5 APIs (`connect_options_builder`, properties), enabling richer metadata and control.

---

## Patterns & Tips

- Keep topics structured (`device/{id}/telemetry`, `device/{id}/cmd`)
- Use retained messages for latest config/status; avoid retaining ever‑changing telemetry
- Design idempotent consumers (QoS1 may duplicate)
- Backoff reconnects; use LWT on `status/{id}` to mark offline
- Batch/pack small payloads; consider CBOR/JSON; compress if needed
- Prefer TLS; rotate credentials; restrict ACLs per client

## Troubleshooting

- Verify broker ACLs; auth failures are silent sometimes
- Watch keep‑alive & inflight limits; QoS2 perf costs
- Test with `mosquitto_pub/sub` and `mqtt-cli`; enable broker logs

---

With a small C++ client using Paho or libmosquitto, you can publish/subscribe reliably, add TLS and LWT, and scale from local dev to production brokers with QoS and session controls.
