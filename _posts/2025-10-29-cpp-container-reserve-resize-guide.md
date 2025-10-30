---
layout: post
title: "Containers: reserve vs resize (Capacity, Growth, Invalidation)"
date: 2025-10-29 00:00:00 -0700
categories: cpp containers performance
permalink: /2025/10/29/cpp-container-reserve-resize-guide/
tags: [cpp, containers, vector, string, deque, list, forward_list, unordered_map, unordered_set, map, set, performance]
---

# C++ Containers: reserve vs resize (Capacity, Growth, Invalidation)

This guide explains how `reserve` and `resize` work across standard containers, when to use each, and their impact on performance and iterator validity. Includes runnable examples and quick rules of thumb.

## TL;DR

- **reserve(n)**: Adjusts capacity to hold at least `n` elements without reallocation. Does NOT change size.
- **resize(n, value?)**: Changes size to exactly `n`. Grows by inserting default/`value`-initialized elements; shrinks by removing from the end.
- Only capacity-based containers (e.g., `std::vector`, `std::string`, `std::unordered_*`) support `reserve`.
- Linked containers (`std::list`, `std::forward_list`) have no capacity and thus no `reserve`.

---

## std::vector

- Has size and capacity.
- `reserve` affects capacity only; `resize` affects size (and may reallocate if capacity is insufficient).
- Reallocation invalidates pointers, references, and iterators to elements.

```cpp
#include <vector>
#include <cassert>

int main() {
    std::vector<int> v;         // size=0, capacity>=0
    v.reserve(100);             // capacity>=100, size still 0
    assert(v.size() == 0);

    v.resize(5, 7);             // size=5, values {7,7,7,7,7}
    v.resize(3);                // size=3, values {7,7,7}

    // Growth without repeated reallocations
    v.reserve(1000);
    for (int i = 0; i < 1000; ++i) v.push_back(i);
}
```

- Shrinking capacity: `shrink_to_fit()` is non-binding; may or may not reduce capacity.

```cpp
v.resize(10);
v.shrink_to_fit(); // hint to reduce capacity to ~size
```

### When to reserve

- You know (or can estimate) how many elements will be inserted → call `reserve(N)` once to avoid multiple expensive reallocations and copies/moves.

### Iterator invalidation (vector)

- Reallocation invalidates all iterators, references, and pointers to elements.
- Insertion/erase at end may invalidate `end()` and following; reallocation invalidates all.

---

## std::string

- Same rules as `std::vector<char>`.
- `reserve`, `resize`, `shrink_to_fit` behave similarly.

```cpp
#include <string>

std::string s;
s.reserve(1024);
s.resize(5, 'x'); // "xxxxx"
```

---

## std::deque

- No `reserve`; capacity managed in blocks.
- `resize` available.
- Insertions at either end typically do NOT invalidate iterators to the other end, but insert/erase in the middle can.

```cpp
#include <deque>

std::deque<int> d;
d.resize(5, 1); // {1,1,1,1,1}
```

---

## std::list / std::forward_list

- Linked lists; no capacity → no `reserve`.
- `resize` exists and inserts/removes nodes.
- Iterators remain valid on insert/erase except at erased elements.

```cpp
#include <list>

std::list<int> L;
L.resize(3, 2); // {2,2,2}
L.resize(1);    // {2}
```

`std::forward_list` is similar, but singly-linked and lacks size() in O(1).

---

## std::unordered_map / std::unordered_set

- Have bucket arrays; `reserve(n)` sets target for number of elements, triggers rehash when needed.
- Prefer `reserve(n)` (or `rehash(buckets)`) before bulk insertions to avoid repeated rehashing.

```cpp
#include <unordered_map>

std::unordered_map<int, int> um;
um.reserve(10000);
for (int i = 0; i < 10000; ++i) um.emplace(i, i*i);
```

### Load factor and rehash

- Rehash moves all elements to new buckets (invalidates iterators, but references to elements remain valid in C++11+? → For unordered containers, rehash invalidates iterators; references/pointers to elements are not invalidated).

```cpp
um.rehash(20000); // control bucket count directly
```

---

## std::map / std::set

- Tree-based; no capacity → no `reserve`.
- `resize` not provided (size controlled by insert/erase).
- Iterators remain valid except erased ones; insert does not invalidate iterators.

---

## Adaptor Containers (std::queue, std::stack, std::priority_queue)

- Built on underlying containers (default: `deque` for queue/stack, `vector` for priority_queue).
- No `reserve`/`resize` on the adaptor; you can pre-reserve on the underlying container and pass it in.

```cpp
#include <queue>
#include <vector>

std::vector<int> backing; backing.reserve(1000);
std::priority_queue<int, std::vector<int>> pq(std::less<int>(), std::move(backing));
```

---

## Growth Strategies and Performance

- `vector`/`string` typically grow geometrically (e.g., ~x1.5 to x2). Reserving prevents multiple reallocations.
- `unordered_*` growth driven by load factor (elements/bucket); reserving lowers rehash frequency.
- `deque` grows by allocating new blocks; minimal relocations.
- Linked lists allocate per node; no contiguous storage.

---

## Common Pitfalls

- Calling `resize(n)` to preallocate for push_back: this creates real elements; you’ll overwrite or handle unexpected values. Use `reserve` instead.

```cpp
std::vector<int> v;
v.resize(1000); // BAD if you meant to avoid reallocation only
for (int i = 0; i < 1000; ++i) v.push_back(i); // size becomes 2000

// Correct:
std::vector<int> u;
u.reserve(1000);
for (int i = 0; i < 1000; ++i) u.push_back(i); // size 1000
```

- Iterators after reallocation are invalid → don’t store raw pointers/iterators across operations that may reallocate.

- `shrink_to_fit` is non-binding → do not rely on it to return memory to the OS.

- For `unordered_*`, using `reserve(n)` with too small `n` causes multiple rehashes; prefer a sound estimate.

---

## Quick Reference Table

- **vector/string**: reserve ✓, resize ✓, shrink_to_fit ✓, geometric growth, reallocation invalidates all iterators
- **deque**: reserve ✗, resize ✓, block growth, partial invalidation rules
- **list/forward_list**: reserve ✗, resize ✓, node-based, stable iterators (except erased)
- **unordered_map/unordered_set**: reserve ✓ (affects bucket count), rehash ✓, iterator invalidation on rehash
- **map/set**: reserve ✗, resize ✗, node-based, stable iterators
- **adaptors**: reserve/resize ✗ (use underlying)

---

## Bonus: Pre-sizing with insert algorithms

Sometimes `resize` plus transform/fill is clearer and faster than repeated push_back:

```cpp
#include <vector>
#include <algorithm>

std::vector<int> v;
v.resize(1000);
std::iota(v.begin(), v.end(), 0);
```

Or use `assign`:

```cpp
std::vector<int> v;
v.assign(1000, 42); // size=1000, all 42
```

---

Reserving and resizing correctly can dramatically reduce allocations and iterator invalidation, improving both throughput and latency in tight loops and high-scale code.

