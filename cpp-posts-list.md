---
layout: page
title: "C++ Posts List"
permalink: /cpp-posts-list/
date: 2025-12-03
categories: cpp reference posts-list
---

# C++ Posts List

This page contains a comprehensive list of all C++ blog posts, organized by category, topic, and date. Use this page to quickly find posts on specific topics.

## Summary Statistics

- **Total Posts:** {{ site.posts.size }}
- **Categories:** Multiple categories covering C++ fundamentals, STL, concurrency, modern C++, embedded systems, and more

## All Posts

| Title | Date | Categories | Tags | Link |
|-------|------|------------|------|------|
{% for post in site.posts %}
| {{ post.title | escape }} | {{ post.date | date: "%b %-d, %Y" }} | {{ post.categories | join: ", " }} | {{ post.tags | join: ", " }} | [View Post]({{ post.url | relative_url }}) |
{% endfor %}

---

## Posts by Category

### Fundamentals and Basics

{% assign fundamentals = site.posts | where_exp: "post", "post.categories contains 'programming' or post.title contains 'Cheat' or post.title contains 'Pointers' or post.title contains 'References' or post.title contains 'Volatile'" %}
{% for post in fundamentals %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%b %-d, %Y" }}
{% endfor %}

### STL Containers

{% assign containers = site.posts | where_exp: "post", "post.title contains 'vector' or post.title contains 'string' or post.title contains 'map' or post.title contains 'set' or post.title contains 'list' or post.title contains 'deque' or post.title contains 'array' or post.title contains 'unordered' or post.title contains 'Container'" %}
{% for post in containers %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%b %-d, %Y" }}
{% endfor %}

### STL Algorithms and Iterators

{% assign algorithms = site.posts | where_exp: "post", "post.title contains 'algorithm' or post.title contains 'iterator' or post.title contains 'lambda' or post.title contains 'Lambda'" %}
{% for post in algorithms %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%b %-d, %Y" }}
{% endfor %}

### Smart Pointers and Memory Management

{% assign smart_pointers = site.posts | where_exp: "post", "post.title contains 'smart' or post.title contains 'pointer' or post.title contains 'shared_ptr' or post.title contains 'unique_ptr' or post.title contains 'weak_ptr' or post.title contains 'Memory'" %}
{% for post in smart_pointers %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%b %-d, %Y" }}
{% endfor %}

### Concurrency and Multi-Threading

{% assign concurrency = site.posts | where_exp: "post", "post.categories contains 'concurrency' or post.categories contains 'multithreading'" %}
{% for post in concurrency %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%b %-d, %Y" }}
{% endfor %}

### Modern C++ Features

{% assign modern_cpp = site.posts | where_exp: "post", "post.title contains 'C++11' or post.title contains 'C++14' or post.title contains 'C++17' or post.title contains 'C++20' or post.title contains 'C++23' or post.title contains 'C++26' or post.title contains 'Modern' or post.title contains 'Features'" %}
{% for post in modern_cpp %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%b %-d, %Y" }}
{% endfor %}

### Function Pointers and Callbacks

{% assign callbacks = site.posts | where_exp: "post", "post.title contains 'callback' or post.title contains 'function' or post.title contains 'Pointers' or post.title contains 'Callback'" %}
{% for post in callbacks %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%b %-d, %Y" }}
{% endfor %}

### Embedded Systems and IoT

{% assign embedded = site.posts | where_exp: "post", "post.categories contains 'embedded' or post.title contains 'BLE' or post.title contains 'Bootloader' or post.title contains 'Android' or post.title contains 'DMA' or post.title contains 'RTOS' or post.title contains 'Firmware' or post.title contains 'Matter' or post.title contains 'MQTT'" %}
{% for post in embedded %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%b %-d, %Y" }}
{% endfor %}

### Interview Preparation

{% assign interview = site.posts | where_exp: "post", "post.categories contains 'interview' or post.title contains 'Interview' or post.title contains 'LeetCode' or post.title contains 'Meta' or post.title contains 'Palo Alto'" %}
{% for post in interview %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%b %-d, %Y" }}
{% endfor %}

### System Design

{% assign system_design = site.posts | where_exp: "post", "post.categories contains 'system-design' or post.title contains 'System Design'" %}
{% for post in system_design %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%b %-d, %Y" }}
{% endfor %}

### Database and Backend

{% assign database = site.posts | where_exp: "post", "post.categories contains 'database' or post.title contains 'PostgreSQL' or post.title contains 'SQL' or post.title contains 'Flask'" %}
{% for post in database %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%b %-d, %Y" }}
{% endfor %}

### Learning Paths and Guides

{% assign learning = site.posts | where_exp: "post", "post.title contains 'Learning Path' or post.title contains 'learning-path' or post.title contains 'Complete Guide' or post.title contains 'Complete Learning Path' or post.title contains 'Learning Map'" %}
{% for post in learning %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%b %-d, %Y" }}
{% endfor %}

---

## Posts by Date (Most Recent First)

{% for post in site.posts limit: 50 %}
- [{{ post.title }}]({{ post.url | relative_url }}) - {{ post.date | date: "%b %-d, %Y" }}
  - Categories: {{ post.categories | join: ", " }}
  - Tags: {{ post.tags | join: ", " }}
{% endfor %}

---

## Quick Links

- [C++ Complete Learning Path]({% post_url 2025-12-03-cpp-learning-path-complete %}) - All posts organized by category
- [C++ Multi-Threading Learning Paths]({% post_url 2025-12-03-cpp-multithreading-learning-paths %}) - Multi-threading specific learning path
- [C++ Learning Map]({{ "/cpp-learning-map/" | relative_url }}) - Structured learning roadmap

---

_Last updated: {{ site.time | date: "%B %-d, %Y" }}_  
_Total posts: {{ site.posts.size }}_
