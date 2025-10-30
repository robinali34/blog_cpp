---
layout: post
title: "System Design: Distributed Rate Limiter"
date: 2025-10-30 23:08:00 -0700
categories: system-design architecture reliability
permalink: /2025/10/30/system-design-rate-limiter/
tags: [system-design, redis, token-bucket, leaky-bucket, lua, consistency]
---

# System Design: Distributed Rate Limiter

## Requirements
- Enforce per-user and per-IP limits (e.g., 100 req/min), burst handling, low latency, global distribution.

## Approaches
- Token bucket in Redis with Lua scripts (atomic); or sliding window counters.

## Architecture
Clients → Gateway → Limiter SDK → Redis/Memcache cluster (sharded) → Fallback local estimators.

## Data model
`key = tenant:user:minute` → counters; or `key = tenant:user` → (tokens, last_ts).

## Consistency
- Prefer strong atomic ops (Lua) per key; eventual across regions with locality; shadow write to secondary.

## SLOs
- Check P95 < 5 ms; availability 99.99% (graceful degrade to stricter local limits on Redis outage).

## Capacity
- 1M rps checks: shard across 10 Redis primaries (100k rps each); pipeline ops.

## Failure modes
- Hot keys → add jitter to keys (bucketize), hierarchical keys.
- Region outage → fail open/closed per product policy.


