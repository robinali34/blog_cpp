---
layout: post
title: "System Design Overview: Cloud-Native Architectures"
date: 2025-10-30 21:45:00 -0700
categories: system-design architecture cloud
permalink: /2025/10/30/system-design-overview-cloud/
tags: [system-design, cloud, microservices, kubernetes, api-gateway, caching, streaming, observability]
---

# System Design Overview: Cloud-Native Architectures

A practical map of cloud system design: entry points, compute patterns, data stores, async pipelines, resilience, security, and observability.

## Reference blueprint

```
Clients → CDN/Edge → API Gateway (AuthN/Z, WAF, Rate‑limit)
          ├── REST/GraphQL Services (K8s) → Cache (Redis)
          ├── Async Workers (Queues/Streams)
          ├── Batch/ETL (Airflow/Spark)
          └── Admin/Backoffice

State: OLTP (Postgres/MySQL), NoSQL (Dynamo/Cassandra), Blob (S3/GCS), Search (Elastic), Analytics (BigQuery/ClickHouse)
Infra: Kubernetes, Service Mesh, IaC (Terraform), Secrets (KMS)
```

## Core patterns

- API gateway: authentication (OIDC), request shaping, routing, circuit breakers.
- Microservices on K8s: autoscaling, HPA, pod disruption budgets, rolling and canary deploys.
- Caching: edge (CDN), app‑side Redis, database read replicas; cache‑aside + TTL + stampede control.
- Messaging: queues (SQS/PubSub) for async work; streams (Kafka) for event sourcing and fanout.
- Data stores: choose per access pattern (OLTP for transactions, NoSQL for key‑value/scale, search for text, columnar for analytics).

## Reliability

- Graceful degradation and feature flags; backpressure; rate limits.
- Multi‑AZ by default; multi‑region active‑active reads where feasible; RPO/RTO defined and tested.
- Idempotency keys for mutable APIs; retries with jitter; dead‑letter queues.

## Security

- Principle of least privilege (IAM); encryption in transit (mTLS) and at rest (KMS).
- Secret management, key rotation, short‑lived tokens; audit trails (WORM where needed).
- WAF, bot protection, and abuse detection on edges.

## Observability

- Structured logs, metrics, and traces (OpenTelemetry); SLOs and burn‑rate alerts.
- Blackbox probes and synthetic tests; chaos experiments with blast radius limits.

## Cost & performance

- Right‑size instances; autoscale; spot capacity for batch.
- Tune hot paths (lock contention, connection pools); profile with p99 focus.

## Interview checklist

- Entry → gateway → services → data; sync vs async; cache strategy; failure modes; rollout plan; SLOs.


