---
layout: post
title: "C++ Pipeline Pattern: Real-World Engineering Guide"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading design-patterns pipeline
permalink: /2025/12/03/cpp-pattern-pipeline-real-world/
tags: [cpp, concurrency, multithreading, design-patterns, pipeline, staged-execution, real-world]
excerpt: "Learn the Pipeline pattern in C++: what problem it solves, how it works, STL usage, examples, use cases, and best practices for real-world engineering."
---

# C++ Pipeline Pattern: Real-World Engineering Guide

## Problem Solved

Break complex work into sequential stages, each running in a dedicated thread or thread pool, exploiting parallelism across stages.

## How It Works

- Stage 1 → Queue → Stage 2 → Queue → Stage 3 → ...
- Each stage processes items and passes to next
- Stages run in parallel on different items

## STL Usage

```cpp
#include <queue>
#include <thread>
#include <vector>
#include <functional>
#include <mutex>
#include <condition_variable>
#include <memory>
#include <atomic>
using namespace std;

template<typename T>
class PipelineStage {
private:
    queue<T> input_queue_;
    mutex mtx_;
    condition_variable cv_;
    function<T(T)> processor_;
    thread worker_;
    atomic<bool> stop_{false};

public:
    PipelineStage(function<T(T)> processor) : processor_(processor) {
        worker_ = thread([this]() {
            while (!stop_) {
                T item;
                {
                    unique_lock<mutex> lock(mtx_);
                    cv_.wait(lock, [this]() { return stop_ || !input_queue_.empty(); });
                    if (stop_ && input_queue_.empty()) break;
                    item = input_queue_.front();
                    input_queue_.pop();
                }
                
                T result = processor_(item);
                if (next_stage_) {
                    next_stage_->enqueue(result);
                }
            }
        });
    }

    void enqueue(const T& item) {
        {
            lock_guard<mutex> lock(mtx_);
            input_queue_.push(item);
        }
        cv_.notify_one();
    }

    PipelineStage<T>* next_stage_ = nullptr;

    ~PipelineStage() {
        stop_ = true;
        cv_.notify_one();
        worker_.join();
    }
};

template<typename T>
class Pipeline {
private:
    vector<unique_ptr<PipelineStage<T>>> stages_;

public:
    void addStage(function<T(T)> processor) {
        stages_.push_back(make_unique<PipelineStage<T>>(processor));
        if (stages_.size() > 1) {
            stages_[stages_.size() - 2]->next_stage_ = stages_.back().get();
        }
    }

    void process(const T& item) {
        if (!stages_.empty()) {
            stages_[0]->enqueue(item);
        }
    }
};
```

## Example

```cpp
#include <iostream>
#include <string>
using namespace std;

void pipelineExample() {
    Pipeline<string> pipeline;
    
    // Stage 1: Read
    pipeline.addStage([](string input) {
        return "Read: " + input;
    });
    
    // Stage 2: Process
    pipeline.addStage([](string input) {
        return "Processed: " + input;
    });
    
    // Stage 3: Write
    pipeline.addStage([](string input) {
        cout << "Output: " << input << endl;
        return input;
    });
    
    for (int i = 0; i < 10; ++i) {
        pipeline.process("Item " + to_string(i));
    }
    
    this_thread::sleep_for(chrono::seconds(2));
}
```

## Use Cases

- **Image processing**: Capture → process → compress → upload
- **Data pipelines**: Extract → transform → load
- **Video processing**: Decode → filter → encode
- **Log processing**: Parse → filter → aggregate → store

## Key Takeaways

- Exploits parallelism across stages
- Each stage can process different items simultaneously
- Good for sequential processing pipelines
- High throughput for streaming data

## Things to Be Careful About

- **Backpressure**: Slow stages can fill queues
- **Error handling**: Errors in one stage affect pipeline
- **Shutdown**: Ensure all items processed
- **Bottlenecks**: Slowest stage limits throughput

## Summary

Pipelines enable efficient parallel processing of sequential stages, maximizing throughput for streaming workloads.

