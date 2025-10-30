---
layout: post
title: "Power Management for Embedded Systems: Modes, DVFS, and Measurement"
date: 2025-10-29 22:50:00 -0700
categories: embedded power
permalink: /2025/10/29/power-management-design/
tags: [power, dvfs, sleep, measurement, pmic]
---

# Power Management for Embedded Systems

Design strategies and measurements for meeting battery targets.

## Modes

- Active, idle (WFI/WFE), sleep/stop, ship; wake sources; retention RAM.

## DVFS and duty cycling

- Schedule heavy work near charging; reduce sensor/ML rates when unplugged; coalesce wakeups.

## Measurement

- Use power analyzer; log mA vs. mode; compute Wh/day; set budgets per feature.

## Example budget table (per hour)

- BLE idle: 2 mA; IMU 100 Hz: 1 mA; Wi‑Fi bursts: 50 mA for 1% duty; MCU active: 8 mA for 10% duty → avg ≈ ~3.3 mA.
