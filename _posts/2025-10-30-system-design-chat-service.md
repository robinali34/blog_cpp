---
layout: post
title: "System Design: Chat/Messaging Service"
date: 2025-10-30 23:12:00 -0700
categories: system-design architecture realtime
permalink: /2025/10/30/system-design-chat-service/
tags: [system-design, websocket, pubsub, storage, ordering, presence]
---

# System Design: Chat/Messaging

## Requirements
- One-to-one and group chats, delivery/read receipts, presence, search, attachments, E2E optional.

## Architecture
Clients → Gateway (auth) → WebSocket Fanout + Pub/Sub (Kafka) → Message Store (Cassandra) → Search (Elastic) → Attachments (S3/CDN)

## Ordering/IDs
- Per-conversation monotonic ids via time+shard (snowflake) or per-partition sequence; resolve on client.

## Data model
`conversations(id, members, type)`
`messages(conv_id, msg_id, sender, ts, body, status)`

## SLOs
- Send ACK P95 < 200 ms; delivery < 1 s; presence < 2 s convergence.

## Consistency
- At-least-once over pub/sub; idempotent message writes by (conv_id,msg_id);
- Read-your-writes with sticky reads.

## Failure modes
- Hot group → split shards, partial fanout; degraded typing indicators under load.


