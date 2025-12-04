---
layout: post
title: "System Design Overview: Cloud Services and Distributed Architectures"
date: 2025-10-30 00:00:00 -0700
categories: system-design cloud architecture distributed-systems
tags: cloud system-design architecture scalability reliability observability
permalink: /2025/10/30/system-design-overview-cloud/
excerpt: "Core concepts for cloud system design: scalability models, data partitioning, resilience, observability, and cost-aware architectures."
---

# System Design Overview: Cloud Services and Distributed Architectures

Designing large-scale cloud systems requires balancing scalability, reliability, latency, and cost. This overview distills the core concepts interviewers expect, along with practical checklists for production systems.

## Scalability Models

### Horizontal vs Vertical Scaling
- **Vertical**: increase compute/memory on a single node; fast but limited and expensive.
- **Horizontal**: add more nodes; needs stateless services, consistent hashing, or sharding.

### Stateless vs Stateful Services
- Keep application servers stateless (`JWT`, cached session) to scale quickly.
- Push state into durable stores (databases, caches, message queues).

### Partitioning and Sharding Patterns
- **Hash-based sharding**: uniform distribution, but hard to rebalance.
- **Range sharding**: efficient scans but needs hotspot mitigation.
- **Directory-service**: metadata service maps keys → shards (easier reshard).

## Data Management

### Storage Tiers
- **Hot path**: in-memory caches (`Redis/Memcached`) for low-latency reads.
- **Warm path**: SSD-backed NoSQL / relational DB for critical data.
- **Cold path**: object storage (S3, GCS) for archival analytics.

### Consistency Spectrum
- Strong consistency (CP) for financial or ordering flows.
- Eventual consistency (AP) for social feeds, analytics, counters.
- Apply **read-your-writes** or **bounded-staleness** when UX needs freshness.

### Caching Strategies
- **Read-through**: app reads cache, falls back to DB.
- **Write-through**: writes update cache + DB; higher latency but fresh.
- **Write-behind**: queue writes for async flush; great throughput, but watch durability.
- Use TTLs, versioned keys, and cache invalidation policies (LRU/LFU/custom).

## Resilience and Availability

### Multi-Region Designs
- Active-active: low latency, requires conflict resolution (CRDT/last-write-wins).
- Active-passive: simpler failover; warm standby with async replication.

### Failure Isolation
- Bulkhead services by team/domain.
- Rate-limit upstream dependencies to prevent cascading failures.
- Implement circuit breakers + retries with jitter/backoff.

### Disaster Recovery Checklist
1. Automated backups with versioning and regional redundancy.
2. Chaos testing to validate failover runbooks.
3. Health probes + auto remediation (restart, roll back, fail over).

## Observability and Operations

- **Metrics**: RED/USE (Rate, Errors, Duration / Utilization, Saturation, Errors).
- **Tracing**: end-to-end context IDs, sampling policies, SLO alignment.
- **Logging**: structured JSON logs, retention policies, PII scrubbing.
- **Automation**: infra as code, canary deployments, staged rollouts.

## Cost and Performance Levers

- Pick the right storage tier (latency vs cost).
- Compress and batch network calls, leverage CDN edge caching.
- Autoscale using predictive signals, not just CPU.
- Monitor per-tenant cost with tagging and showback reports.

## Interview Ready Checklist

- Articulate bottlenecks (CPU, memory, IO, hotspots).
- Provide back-of-envelope capacity estimates.
- Explain tradeoffs (consistency vs availability, latency vs durability).
- Highlight observability, on-call playbooks, and failure scenarios.

Cloud system design is about explicit tradeoffs. Use these sections as a blueprint to structure answers and real-world architectures.

