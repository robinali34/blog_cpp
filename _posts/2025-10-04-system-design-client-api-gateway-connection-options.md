---
layout: post
title: "System Design: Client ↔ API Gateway Connection Options"
date: 2025-10-04 00:00:00 -0700
categories: system-design networking architecture
tags: api-gateway client-architecture http2 grpc websockets long-polling security
permalink: /2025/10/04/system-design-client-api-gateway-connection-options/
excerpt: "Comparison of client-to-gateway connection models: REST, HTTP/2 streaming, gRPC, WebSockets, long polling, and hybrid patterns with security and scalability tradeoffs."
---

# System Design: Client ↔ API Gateway Connection Options

Choosing the right connection pattern between clients and API gateways impacts latency, scalability, and developer experience. This guide compares common options and provides a decision framework.

## Baseline Requirements

- **Transport**: TLS everywhere (`HTTPS`, mutual TLS for B2B/IoT), ALPN negotiation.
- **AuthN/AuthZ**: OAuth 2.0 / OIDC tokens, short-lived credentials, optional mTLS.
- **Observability**: request IDs, structured logs, histogram metrics, distributed traces.
- **Backpressure**: rate limiting per tenant, circuit breakers, adaptive concurrency limits.

## REST over HTTPS (HTTP/1.1)

### Pros
- Widely supported, simple tooling, cache-friendly (`GET` + CDN).
- Stateless; easy to scale horizontally with load balancers.

### Cons
- One request per TCP connection (without keep-alive); higher latency for chattier clients.
- Harder to stream incremental updates.

### When to Use
- CRUD APIs, public developer platforms, mobile apps with intermittent usage.

## HTTP/2 Multiplexing

- Single TCP connection with multiplexed streams → reduced head-of-line blocking.
- Server push for configuration/bootstrap assets (careful with cacheability).
- Requires gateways that understand stream prioritization.

## gRPC (HTTP/2)

- Contract-first (`proto`), code generation, strongly typed errors.
- Supports unary, server streaming, client streaming, bi-directional streaming.
- Great for low-latency service-to-service or mobile/IoT with tight control.
- Consider transcoding layer (gRPC ↔ REST) for browser compatibility.

## WebSockets

- Full-duplex channel over a single TCP connection.
- Ideal for low-latency push (chat, gaming, monitoring dashboards).
- Requires heartbeat/ping frames, reconnection strategies, and fan-out infra.

### Scaling WebSockets
- Use sticky sessions (consistent hashing) or connection brokers.
- Broadcast via pub/sub (Redis, NATS, Kafka) to avoid O(N) writes per server.

## Long Polling / Server-Sent Events

- **Long polling**: client issues request, server holds until data ready (or timeout).
- **SSE**: server pushes events over HTTP stream; simpler than WebSockets but one-way.
- Useful where WebSockets not allowed (enterprise proxies) yet timely updates needed.

## Hybrid Patterns

- REST for control plane + WebSockets/gRPC streaming for data plane.
- Use GraphQL over HTTP/2 for aggregated reads, fallback to REST for mutations.
- Edge caches + differential sync for bandwidth-constrained devices.

## Security Considerations

- Terminate TLS at gateway but support end-to-end encryption for regulated data.
- Rotate client certificates/keys; enforce token binding or proof-of-possession when possible.
- Mitigate replay with nonce/timestamp, especially for IoT devices.

## Decision Checklist

| Requirement | Best Fit |
|-------------|----------|
| Simple CRUD, broad compatibility | REST/HTTP/1.1 |
| Chatty client, low latency | HTTP/2 or gRPC |
| Real-time updates, bi-directional | WebSockets or gRPC streaming |
| Browser push-only | Server-Sent Events |
| Intermittent connectivity | Long polling with exponential backoff |

Evaluate client environment, network reliability, payload size, and operational maturity before finalizing a connection strategy.

