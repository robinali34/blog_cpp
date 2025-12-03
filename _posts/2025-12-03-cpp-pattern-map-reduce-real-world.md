---
layout: post
title: "C++ Map-Reduce Pattern: Real-World Engineering Guide"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading design-patterns map-reduce
permalink: /2025/12/03/cpp-pattern-map-reduce-real-world/
tags: [cpp, concurrency, multithreading, design-patterns, map-reduce, parallel-processing, real-world]
excerpt: "Learn the Map-Reduce pattern in C++: what problem it solves, how it works, STL usage, examples, use cases, and best practices for real-world engineering."
---

# C++ Map-Reduce Pattern: Real-World Engineering Guide

## Problem Solved

Parallelize independent computations then aggregate results efficiently.

## How It Works

- **Map phase**: Split work into parallel chunks, process independently
- **Reduce phase**: Merge results (sum, max, combine objects)
- Each phase can run in parallel

## STL Usage

```cpp
#include <vector>
#include <thread>
#include <numeric>
#include <algorithm>
#include <future>
using namespace std;

template<typename InputIt, typename MapFunc, typename ReduceFunc>
auto mapReduce(InputIt first, InputIt last, MapFunc map_func, ReduceFunc reduce_func, size_t num_threads)
    -> decltype(reduce_func(map_func(*first), map_func(*first))) {
    
    using MapResult = decltype(map_func(*first));
    using ReduceResult = decltype(reduce_func(MapResult{}, MapResult{}));
    
    size_t total = distance(first, last);
    size_t chunk_size = total / num_threads;
    
    vector<future<MapResult>> futures;
    
    // Map phase: parallel processing
    for (size_t i = 0; i < num_threads; ++i) {
        auto chunk_start = first + i * chunk_size;
        auto chunk_end = (i == num_threads - 1) ? last : chunk_start + chunk_size;
        
        futures.push_back(async(launch::async, [=]() {
            MapResult result{};
            for (auto it = chunk_start; it != chunk_end; ++it) {
                result = reduce_func(result, map_func(*it));
            }
            return result;
        }));
    }
    
    // Reduce phase: combine results
    ReduceResult final_result{};
    for (auto& fut : futures) {
        final_result = reduce_func(final_result, fut.get());
    }
    
    return final_result;
}
```

## Example

```cpp
#include <iostream>
using namespace std;

void mapReduceExample() {
    vector<int> data(1000);
    iota(data.begin(), data.end(), 1);
    
    // Map: square each number, Reduce: sum all
    int result = mapReduce(
        data.begin(), data.end(),
        [](int x) { return x * x; },  // Map function
        [](int a, int b) { return a + b; },  // Reduce function
        4  // Number of threads
    );
    
    cout << "Sum of squares: " << result << endl;
}
```

## Use Cases

- **Data processing**: Process large datasets in parallel
- **Parallel algorithms**: Divide and conquer
- **Big data**: Distributed computation
- **Scientific computing**: Parallel numerical operations

## Key Takeaways

- Excellent for parallelizable computations
- Scales well with data size
- Two-phase approach: map then reduce
- Common in distributed systems

## Things to Be Careful About

- **Data dependencies**: Map operations must be independent
- **Reduce associativity**: Reduce function must be associative
- **Load balancing**: Ensure even work distribution
- **Memory usage**: Large intermediate results

## Summary

Map-Reduce is powerful for parallel data processing, enabling efficient parallelization of independent computations.

