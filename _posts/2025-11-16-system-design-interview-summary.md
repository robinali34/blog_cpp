---
layout: post
title: "System Design Interview Summary"
date: 2025-11-16 00:00:00 -0700
categories: interview-preparation system-design software-engineering
tags: system-design interview-preparation architecture scalability reliability
permalink: /system-design-interview/
excerpt: "A comprehensive guide to system design interviews covering what interviewers look for, company-specific focus areas, pacing strategies, checklists, and evaluation rubrics."
---

# System Design Interview Summary

This guide serves as both a reference for system design interviews and a practical resource for designing real-world systems. Use it as a checklist for interview practice, or as a framework when architecting production systems. Tailor depth to role level and domain.

## What interviewers look for

- Problem framing: clarify product goals, constraints, traffic, SLOs.
- Architecture: right components, sync vs async, data stores, caches.
- Reasoning: back-of-the-envelope capacity, trade-offs, consistency.
- Operational maturity: SLOs, error budgets, rollout, observability, cost.
- Evolution: phased plan, de-risking, failure modes and mitigations.

## Company focus cues

- Google: SLOs/error budgets, capacity math, storage and indexing, consistency semantics, multi-region.
- Meta: product thinking + practical scale; caching/fanout/feed patterns; experimentation and metrics.
- Salesforce: multi-tenancy, data security, compliance (SOX/PCI), integration patterns, API governance.
- Robinhood/Fintech: strong consistency for money/orders, audit/regulatory artifacts, risk engines.

## 30/60/90 minute pacing

- 0–5: restate scope, define users, success metrics, SLOs.
- 5–15: APIs, high-level diagram, data model; call out consistency domains.
- 15–30: deep dive critical path; capacity and storage math.
- 30–45: reliability (circuit breakers, retries, idempotency), caching, indexing, queues.
- 45–55: failure drills, observability, rollout, cost.
- 55–60: recap trade-offs, next steps, evolution.

## Capacity checklist

- QPS/read-write mix; payload sizes; fanout; egress. Hot vs cold paths; cache hit rate targets.
- Storage/day (raw vs. compressed), retention; index sizes; partitioning keys.

## Consistency checklist

- Strong vs eventual; idempotency keys; dedupe; outbox/inbox; exactly-once illusions.

## Reliability checklist

- SLOs (p95 latency, availability), error budgets, brownouts; backpressure and load shedding.
- Multi-AZ default; multi-region read strategy; state reconciliation.

## Security/compliance

- AuthZ models, secrets/KMS, encryption; audit trails/immutability; data retention; PII/PCI/SOX.

## Practice links (from this blog)

- [Embedded System Design Showcase]({% post_url 2025-10-29-embedded-system-design-showcase %})

## One last tip

Explicitly state SLOs and capacity numbers early. It anchors trade-offs and helps interviewers follow your choices.

## Scoring and evaluation

Rubric dimensions (commonly used across Google/Meta/Salesforce/fintech)
- Problem framing & requirements: clarifies scope, users, constraints, success metrics, SLOs.
- Architecture & decomposition: chooses appropriate components; clear boundaries; sync vs async separation.
- Data & storage: correct data models, indexing/partitioning, hot vs cold storage, TTL/retention.
- Capacity math: reasonable back-of-the-envelope for QPS, storage/day, egress, cache hit rates.
- Reliability & operations: SLOs/error budgets, backpressure, retries/idempotency, rollout, canaries, oncall readiness.
- Consistency & correctness: identifies strong vs eventual domains; idempotency keys; dedupe/outbox; ordering.
- API design & contracts: versioning, pagination, idempotency, authn/z; clear interfaces.
- Security, privacy, compliance: IAM/KMS, encryption, PII/PCI/SOX, auditing.
- Observability & testing: metrics/logs/traces, synthetic tests, chaos/failure drills.
- Communication & collaboration: structure, trade-offs, active listening, time management.

Score bands (signal examples)
- Strong hire: Quantifies scale early, states SLOs, proposes viable architecture with trade-offs, does capacity math, handles consistency explicitly, walks through failures and mitigations, presents evolution plan.
- Leaning hire: Good architecture and trade-offs, some scale math, partial SLOs, covers a few failures; minor gaps in consistency or ops.
- Leaning no: Vague requirements, jumps to tech buzzwords, no numbers, misses consistency or failure modes, unclear data model.
- No hire: Fundamentally incorrect design (e.g., single-node bottleneck at target scale), ignores constraints/security, cannot reason about trade-offs.

Red flags
- No numbers anywhere; cannot estimate even roughly.
- Ignores SLOs/availability; no plan for retries/backpressure/idempotency.
- Hand-wavy storage/indexing; ignores pagination, hot keys, or partitioning.
- Over-indexes on tech names over problem fit; solutionism.
- Inflexible communication; doesn't incorporate hints.

Leveling expectations (rough guide)
- L3/Junior: Solid fundamentals, clear communication, correct baseline architecture; may need prompting for capacity/SLOs.
- L4/Mid: Drives structure independently, produces reasonable numbers, identifies key trade-offs and basic failure handling.
- L5/Senior: Anticipates product/ops concerns, quantifies thoroughly, robust consistency/ops plan, strong evolution path.
- L6+/Staff: Multi-region, multi-tenant thinking; cost/operability; risk and compliance where relevant; crisp prioritization and simplification.


