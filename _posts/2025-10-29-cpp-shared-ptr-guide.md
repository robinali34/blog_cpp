---
layout: post
title: "std::shared_ptr: A Practical Guide"
date: 2025-10-29 00:00:00 -0700
categories: cpp smart-pointers memory-management
permalink: /2025/10/29/cpp-shared-ptr-guide/
tags: [cpp, smart-pointers, shared_ptr, weak_ptr, memory, ownership]
---

# C++ std::shared_ptr: A Practical Guide

Everything you need to use `std::shared_ptr` effectively: ownership semantics, control blocks, performance, and common pitfalls—with concise, runnable examples.

## 1) Basics: ownership and lifetime

```cpp
#include <memory>
#include <cassert>

struct Foo { int x{0}; };

int main() {
    std::shared_ptr<Foo> p = std::make_shared<Foo>();
    assert(p.use_count() == 1);

    {
        std::shared_ptr<Foo> q = p; // shared ownership
        assert(p.use_count() == 2);
        q->x = 42;
    } // q destroyed, count decremented

    assert(p.use_count() == 1);
}
```

## 2) Control block: reference counts + deleter + allocator

- Created by `std::make_shared` (preferred) or by constructing `shared_ptr` from a raw pointer
- Holds strong count, weak count, and the deleter
- Reduced allocations with `make_shared` (object + control block together)

```cpp
auto p = std::make_shared<Foo>(); // fast, one allocation
auto q = std::shared_ptr<Foo>(new Foo()); // two allocations, avoid unless custom deleter needed
```

## 3) Custom deleters

```cpp
#include <cstdio>
#include <memory>

struct FILECloser {
    void operator()(FILE* f) const noexcept { if (f) std::fclose(f); }
};

int main() {
    std::shared_ptr<FILE> file(std::fopen("data.txt", "r"), FILECloser{});
}
```

Or with a lambda:

```cpp
auto closer = [](FILE* f){ if (f) std::fclose(f); };
std::shared_ptr<FILE> file(std::fopen("data.txt", "r"), closer);
```

## 4) weak_ptr: break cycles and observe without owning

```cpp
#include <memory>
#include <cassert>

struct Node {
    int v;
    std::shared_ptr<Node> next;
    std::weak_ptr<Node> prev; // weak to break cycle
};

int main() {
    auto a = std::make_shared<Node>();
    auto b = std::make_shared<Node>();
    a->next = b;
    b->prev = a; // no cycle because weak_ptr

    auto pa = b->prev.lock(); // acquire shared ownership if still alive
    assert(pa == a);
}
```

## 5) enable_shared_from_this: get a shared_ptr from this

```cpp
#include <memory>
#include <cassert>

struct Self : std::enable_shared_from_this<Self> {
    std::shared_ptr<Self> getPtr() { return shared_from_this(); }
};

int main() {
    auto s = std::make_shared<Self>();
    auto p = s->getPtr();
    assert(p.use_count() == 2);
}
```

Avoid constructing an object managed by `shared_ptr` with a raw pointer to `this` before a `shared_ptr` exists—use `make_shared`.

## 6) Aliasing constructor: share ownership, different pointer

```cpp
#include <memory>
#include <vector>
#include <cassert>

struct Obj { std::vector<int> data{1,2,3}; };

int main() {
    auto owner = std::make_shared<Obj>();
    // aliasing: shared ownership of owner, but points to underlying data
    std::shared_ptr<int> element(owner, owner->data.data());
    assert(owner.use_count() == 2);
}
```

## 7) Arrays: prefer std::vector or unique_ptr<T[]> over shared_ptr<T[]>

```cpp
#include <memory>

// If you must use a shared array:
std::shared_ptr<int[]> arr(new int[10]{});
arr[0] = 1; // OK with shared_ptr<T[]>
```

But usually:

- Use `std::vector<T>` for dynamic arrays
- Or `std::unique_ptr<T[]>` when unique ownership suffices

## 8) Thread-safety

- Multiple `shared_ptr` instances can be copied/destroyed concurrently (control block ops are atomic)
- Access to the managed object itself is NOT thread-safe; guard with a mutex
- Prefer copying `shared_ptr` into threads by value if they need ownership

```cpp
#include <thread>
#include <memory>

struct Foo { int x{0}; };

void worker(std::shared_ptr<Foo> p) {
    // safe to copy/use p; protect p's internals if shared
}

int main() {
    auto p = std::make_shared<Foo>();
    std::thread t(worker, p); // copies p
    t.join();
}
```

## 9) Performance tips

- Prefer `std::make_shared` (fewer allocations, better cache locality)
- Avoid `use_count()` for logic; it can be expensive and racy across threads
- Pass `shared_ptr` by value only if you need to share ownership; else prefer `Foo&`/`Foo*`/`const Foo&`
- Avoid creating multiple independent control blocks for the same raw pointer (leads to double delete)

```cpp
Foo* raw = new Foo();
std::shared_ptr<Foo> a(raw);
std::shared_ptr<Foo> b(raw); // BAD: two control blocks managing same raw
```

## 10) Common pitfalls

- Reference cycles (shared_ptr <-> shared_ptr) leak memory → use `weak_ptr` for back references
- Using `shared_from_this()` before object is owned by a `shared_ptr` → undefined behavior
- Capturing `this` raw in async tasks while object is owned elsewhere → prefer capturing a `shared_ptr<Self>`
- Overusing `shared_ptr` for everything → choose the narrowest ownership (raw reference, `unique_ptr`, etc.)

## 11) Putting it all together

```cpp
#include <memory>
#include <mutex>
#include <vector>

struct Image { /* ... */ };

struct Cache : std::enable_shared_from_this<Cache> {
    std::mutex m;
    std::vector<std::weak_ptr<Image>> images; // avoid retaining all images

    std::shared_ptr<Image> loadImage() {
        auto img = std::make_shared<Image>();
        {
            std::lock_guard<std::mutex> lock(m);
            images.emplace_back(img);
        }
        return img;
    }

    std::shared_ptr<Cache> self() { return shared_from_this(); }
};

int main() {
    auto cache = std::make_shared<Cache>();
    auto img = cache->loadImage();
}
```

---

Use `shared_ptr` when multiple owners must co-manage an object's lifetime. Prefer `make_shared`, use `weak_ptr` to prevent cycles, and guard the managed object with proper synchronization when shared across threads.

