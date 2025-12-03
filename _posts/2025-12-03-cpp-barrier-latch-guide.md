---
layout: post
title: "C++ Barrier and Latch: Multi-Thread Synchronization Primitives Guide"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading synchronization barriers latches
permalink: /2025/12/03/cpp-barrier-latch-guide/
tags: [cpp, concurrency, multithreading, barrier, latch, synchronization, cpp20, thread-coordination]
excerpt: "Learn about C++20 barriers and latches for multi-thread synchronization. Guide to coordinating threads, waiting for completion, and implementing parallel algorithms with practical examples."
---

# C++ Barrier and Latch: Multi-Thread Synchronization Primitives Guide

Barriers and latches are synchronization primitives introduced in C++20 that allow threads to wait for each other to reach a common point or complete a set of operations. They are essential for coordinating parallel work and implementing complex multi-threaded algorithms.

## Table of Contents

1. [What are Barriers and Latches?](#what-are-barriers-and-latches)
2. [std::latch (C++20)](#stdlatch-c20)
3. [std::barrier (C++20)](#stdbarrier-c20)
4. [Example 1: Using Latch for Thread Coordination](#example-1-using-latch-for-thread-coordination)
5. [Example 2: Parallel Initialization with Latch](#example-2-parallel-initialization-with-latch)
6. [Example 3: Barrier for Synchronized Phases](#example-3-barrier-for-synchronized-phases)
7. [Example 4: Parallel Algorithm with Barrier](#example-4-parallel-algorithm-with-barrier)
8. [Example 5: Multi-Phase Processing](#example-5-multi-phase-processing)
9. [Complete Working Examples](#complete-working-examples)
10. [Best Practices and Common Pitfalls](#best-practices-and-common-pitfalls)

---

## What are Barriers and Latches?

### std::latch

A **latch** is a one-time synchronization point that allows threads to wait until a counter reaches zero. Once the counter reaches zero, the latch is released and all waiting threads are unblocked.

**Key characteristics:**
- **One-time use**: Cannot be reset or reused
- **Countdown**: Starts with a count, decrements as threads arrive
- **Single release**: Once count reaches zero, all threads are released
- **Use case**: Waiting for a set of threads to complete initialization or setup

### std::barrier

A **barrier** is a reusable synchronization point that blocks threads until a specified number of threads arrive. Once all threads arrive, they are released and the barrier can be reused.

**Key characteristics:**
- **Reusable**: Can be used multiple times
- **Completion function**: Optional callback executed when all threads arrive
- **Phases**: Supports multiple synchronization phases
- **Use case**: Coordinating threads in iterative algorithms or multi-phase processing

### Comparison

| Feature | std::latch | std::barrier |
|---------|-----------|--------------|
| Reusable | No (one-time) | Yes (multiple phases) |
| Counter direction | Countdown to zero | Count up to threshold |
| Completion callback | No | Yes |
| Use case | One-time coordination | Multi-phase coordination |

---

## std::latch (C++20)

### Basic Usage

```cpp
#include <latch>
#include <thread>
#include <vector>
#include <iostream>
using namespace std;

void latchExample() {
    const int NUM_THREADS = 5;
    latch start_latch(NUM_THREADS);  // Wait for 5 threads
    
    vector<thread> threads;
    for (int i = 0; i < NUM_THREADS; ++i) {
        threads.emplace_back([&start_latch, i]() {
            cout << "Thread " << i << " ready" << endl;
            start_latch.arrive_and_wait();  // Decrement and wait
            cout << "Thread " << i << " started!" << endl;
            // All threads proceed together
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
}
```

### Latch Methods

```cpp
class latch {
public:
    explicit latch(ptrdiff_t expected);  // Initialize with count
    
    void count_down(ptrdiff_t n = 1);    // Decrement by n
    bool try_wait() const noexcept;       // Check if count is zero
    void wait() const;                    // Wait until count is zero
    void arrive_and_wait();              // Decrement and wait (atomic)
};
```

### Key Operations

- **`count_down(n)`**: Decrements the counter by `n` (can be called by any thread)
- **`wait()`**: Blocks until counter reaches zero
- **`arrive_and_wait()`**: Atomically decrements by 1 and waits (most common)
- **`try_wait()`**: Non-blocking check if counter is zero

---

## std::barrier (C++20)

### Basic Usage

```cpp
#include <barrier>
#include <thread>
#include <vector>
#include <iostream>
using namespace std;

void barrierExample() {
    const int NUM_THREADS = 4;
    
    // Barrier with completion function
    barrier sync_point(NUM_THREADS, []() {
        cout << "All threads reached the barrier!" << endl;
    });
    
    vector<thread> threads;
    for (int i = 0; i < NUM_THREADS; ++i) {
        threads.emplace_back([&sync_point, i]() {
            for (int phase = 0; phase < 3; ++phase) {
                cout << "Thread " << i << " phase " << phase << endl;
                sync_point.arrive_and_wait();  // Wait for all threads
                cout << "Thread " << i << " after phase " << phase << endl;
            }
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
}
```

### Barrier Methods

```cpp
template<class CompletionFunction = /* implementation-defined */>
class barrier {
public:
    explicit barrier(ptrdiff_t expected, 
                    CompletionFunction f = CompletionFunction());
    
    void arrive_and_wait();              // Arrive and wait for others
    void arrive_and_drop();              // Arrive and leave the barrier
    void wait();                         // Wait at barrier (must have arrived)
};
```

### Key Operations

- **`arrive_and_wait()`**: Arrive at barrier and wait for all threads
- **`arrive_and_drop()`**: Arrive and permanently leave (reduces expected count)
- **`wait()`**: Wait at barrier (must have called arrive first)
- **Completion function**: Called when all threads arrive (before releasing them)

---

## Example 1: Using Latch for Thread Coordination

Coordinate multiple threads to start simultaneously:

```cpp
#include <latch>
#include <thread>
#include <vector>
#include <chrono>
#include <iostream>
using namespace std;

void coordinatedStart() {
    const int NUM_WORKERS = 5;
    latch start_signal(NUM_WORKERS);
    atomic<int> work_completed(0);
    
    vector<thread> workers;
    for (int i = 0; i < NUM_WORKERS; ++i) {
        workers.emplace_back([&start_signal, &work_completed, i]() {
            // Preparation phase
            cout << "Worker " << i << " preparing..." << endl;
            this_thread::sleep_for(chrono::milliseconds(100 * (i + 1)));
            
            // Wait for all workers to be ready
            start_signal.arrive_and_wait();
            
            // All workers start simultaneously
            cout << "Worker " << i << " started at same time!" << endl;
            
            // Do work
            this_thread::sleep_for(chrono::milliseconds(500));
            work_completed++;
            cout << "Worker " << i << " completed work" << endl;
        });
    }
    
    for (auto& t : workers) {
        t.join();
    }
    
    cout << "All " << work_completed << " workers completed" << endl;
}
```

### Output Pattern

```
Worker 0 preparing...
Worker 1 preparing...
Worker 2 preparing...
Worker 3 preparing...
Worker 4 preparing...
Worker 0 started at same time!
Worker 1 started at same time!
Worker 2 started at same time!
Worker 3 started at same time!
Worker 4 started at same time!
...
```

All workers start simultaneously after all preparations complete.

---

## Example 2: Parallel Initialization with Latch

Wait for multiple threads to complete initialization:

```cpp
#include <latch>
#include <atomic>
#include <vector>
using namespace std;

class ParallelSystem {
private:
    vector<string> components_;
    latch init_latch_;
    atomic<bool> initialized_{false};

public:
    ParallelSystem(int num_components) 
        : init_latch_(num_components), components_(num_components) {}

    void initializeComponent(int id, const string& config) {
        // Simulate initialization work
        this_thread::sleep_for(chrono::milliseconds(100 + id * 50));
        components_[id] = config;
        cout << "Component " << id << " initialized: " << config << endl;
        
        // Signal initialization complete
        init_latch_.count_down();
    }

    void waitForInitialization() {
        init_latch_.wait();  // Wait for all components
        initialized_ = true;
        cout << "All components initialized. System ready!" << endl;
    }

    bool isReady() const {
        return initialized_.load();
    }
};

void parallelInitialization() {
    const int NUM_COMPONENTS = 4;
    ParallelSystem system(NUM_COMPONENTS);
    
    // Initialize components in parallel
    vector<thread> init_threads;
    for (int i = 0; i < NUM_COMPONENTS; ++i) {
        init_threads.emplace_back([&system, i]() {
            system.initializeComponent(i, "Config-" + to_string(i));
        });
    }
    
    // Main thread waits for initialization
    thread main_thread([&system]() {
        system.waitForInitialization();
        cout << "Main thread: System is ready to use" << endl;
    });
    
    for (auto& t : init_threads) {
        t.join();
    }
    main_thread.join();
}
```

---

## Example 3: Barrier for Synchronized Phases

Use barrier to synchronize multiple phases of computation:

```cpp
#include <barrier>
#include <vector>
#include <atomic>
using namespace std;

void synchronizedPhases() {
    const int NUM_THREADS = 4;
    const int NUM_PHASES = 3;
    
    vector<int> shared_data(NUM_THREADS, 0);
    barrier phase_barrier(NUM_THREADS);
    
    vector<thread> threads;
    for (int t = 0; t < NUM_THREADS; ++t) {
        threads.emplace_back([&shared_data, &phase_barrier, t, NUM_PHASES]() {
            for (int phase = 0; phase < NUM_PHASES; ++phase) {
                // Phase work
                shared_data[t] += (t + 1) * (phase + 1);
                cout << "Thread " << t << " phase " << phase 
                     << " data: " << shared_data[t] << endl;
                
                // Synchronize at end of phase
                phase_barrier.arrive_and_wait();
                
                // All threads proceed to next phase together
                cout << "Thread " << t << " starting phase " << (phase + 1) << endl;
            }
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    cout << "Final data: ";
    for (int val : shared_data) {
        cout << val << " ";
    }
    cout << endl;
}
```

### Phase Synchronization

Each phase completes for all threads before any thread starts the next phase.

---

## Example 4: Parallel Algorithm with Barrier

Implement parallel reduction or map-reduce pattern:

```cpp
#include <barrier>
#include <vector>
#include <numeric>
#include <algorithm>
using namespace std;

void parallelReduction() {
    const int NUM_THREADS = 4;
    const int DATA_SIZE = 1000;
    
    vector<int> data(DATA_SIZE);
    iota(data.begin(), data.end(), 1);  // Fill with 1, 2, 3, ...
    
    vector<int> partial_sums(NUM_THREADS, 0);
    barrier sync_barrier(NUM_THREADS);
    atomic<int> final_sum(0);
    
    vector<thread> workers;
    for (int t = 0; t < NUM_THREADS; ++t) {
        workers.emplace_back([&data, &partial_sums, &sync_barrier, 
                              &final_sum, t, NUM_THREADS, DATA_SIZE]() {
            // Phase 1: Compute partial sum
            int chunk_size = DATA_SIZE / NUM_THREADS;
            int start = t * chunk_size;
            int end = (t == NUM_THREADS - 1) ? DATA_SIZE : start + chunk_size;
            
            int sum = 0;
            for (int i = start; i < end; ++i) {
                sum += data[i];
            }
            partial_sums[t] = sum;
            cout << "Thread " << t << " partial sum: " << sum << endl;
            
            // Wait for all partial sums
            sync_barrier.arrive_and_wait();
            
            // Phase 2: Combine results (only thread 0 does this)
            if (t == 0) {
                int total = accumulate(partial_sums.begin(), 
                                      partial_sums.end(), 0);
                final_sum = total;
                cout << "Final sum: " << total << endl;
            }
        });
    }
    
    for (auto& t : workers) {
        t.join();
    }
    
    cout << "Parallel reduction completed. Sum: " << final_sum << endl;
}
```

---

## Example 5: Multi-Phase Processing

Complex multi-phase algorithm with barriers:

```cpp
#include <barrier>
#include <vector>
#include <random>
using namespace std;

void multiPhaseProcessing() {
    const int NUM_THREADS = 4;
    const int NUM_PHASES = 5;
    
    vector<vector<int>> thread_data(NUM_THREADS);
    barrier phase_barrier(NUM_THREADS, []() {
        static int phase = 0;
        cout << "\n=== Phase " << ++phase << " completed ===" << endl;
    });
    
    // Initialize data
    for (auto& data : thread_data) {
        data.resize(10);
        iota(data.begin(), data.end(), 0);
    }
    
    vector<thread> processors;
    for (int t = 0; t < NUM_THREADS; ++t) {
        processors.emplace_back([&thread_data, &phase_barrier, t, NUM_PHASES]() {
            for (int phase = 0; phase < NUM_PHASES; ++phase) {
                // Process data
                for (int& val : thread_data[t]) {
                    val = val * 2 + phase;
                }
                
                cout << "Thread " << t << " phase " << phase 
                     << " data: [";
                for (size_t i = 0; i < min(5UL, thread_data[t].size()); ++i) {
                    cout << thread_data[t][i] << " ";
                }
                cout << "...]" << endl;
                
                // Synchronize
                phase_barrier.arrive_and_wait();
            }
        });
    }
    
    for (auto& t : processors) {
        t.join();
    }
    
    cout << "\nMulti-phase processing completed!" << endl;
}
```

---

## Complete Working Examples

### Example: Parallel Matrix Operations

```cpp
#include <iostream>
#include <vector>
#include <thread>
#include <barrier>
#include <latch>
#include <chrono>
#include <numeric>
#include <algorithm>
using namespace std;

class ParallelMatrixProcessor {
private:
    vector<vector<int>> matrix_;
    int num_threads_;
    barrier phase_barrier_;
    latch completion_latch_;

public:
    ParallelMatrixProcessor(const vector<vector<int>>& matrix, int num_threads)
        : matrix_(matrix), num_threads_(num_threads),
          phase_barrier_(num_threads_),
          completion_latch_(num_threads_) {}

    void processRow(int thread_id, int num_rows) {
        int rows_per_thread = matrix_.size() / num_threads_;
        int start_row = thread_id * rows_per_thread;
        int end_row = (thread_id == num_threads_ - 1) 
                     ? matrix_.size() 
                     : start_row + rows_per_thread;

        // Phase 1: Compute row sums
        vector<int> row_sums;
        for (int i = start_row; i < end_row; ++i) {
            int sum = accumulate(matrix_[i].begin(), matrix_[i].end(), 0);
            row_sums.push_back(sum);
        }
        cout << "Thread " << thread_id << " computed " 
             << row_sums.size() << " row sums" << endl;

        // Wait for all threads to finish phase 1
        phase_barrier_.arrive_and_wait();

        // Phase 2: Normalize rows
        for (int i = start_row; i < end_row; ++i) {
            int sum = accumulate(matrix_[i].begin(), matrix_[i].end(), 0);
            if (sum > 0) {
                for (int& val : matrix_[i]) {
                    val = (val * 100) / sum;
                }
            }
        }
        cout << "Thread " << thread_id << " normalized rows" << endl;

        // Signal completion
        completion_latch_.count_down();
    }

    void process() {
        vector<thread> workers;
        for (int t = 0; t < num_threads_; ++t) {
            workers.emplace_back([this, t]() {
                processRow(t, num_threads_);
            });
        }

        // Wait for all threads to complete
        completion_latch_.wait();
        cout << "All processing completed!" << endl;

        for (auto& t : workers) {
            t.join();
        }
    }
};

int main() {
    cout << "=== Parallel Matrix Processing ===" << endl << endl;

    // Create sample matrix
    vector<vector<int>> matrix(100, vector<int>(100));
    for (size_t i = 0; i < matrix.size(); ++i) {
        for (size_t j = 0; j < matrix[i].size(); ++j) {
            matrix[i][j] = (i + j) % 10 + 1;
        }
    }

    ParallelMatrixProcessor processor(matrix, 4);
    processor.process();

    return 0;
}
```

### Example: Thread Pool Initialization

```cpp
#include <latch>
#include <vector>
#include <thread>
#include <functional>
#include <queue>
#include <mutex>
#include <condition_variable>
using namespace std;

class ThreadPool {
private:
    vector<thread> workers_;
    queue<function<void()>> tasks_;
    mutex queue_mutex_;
    condition_variable condition_;
    bool stop_;
    latch ready_latch_;

public:
    ThreadPool(size_t num_threads) 
        : stop_(false), ready_latch_(num_threads) {
        for (size_t i = 0; i < num_threads; ++i) {
            workers_.emplace_back([this, i]() {
                // Signal thread is ready
                ready_latch_.count_down();
                
                while (true) {
                    function<void()> task;
                    {
                        unique_lock<mutex> lock(queue_mutex_);
                        condition_.wait(lock, [this]() {
                            return stop_ || !tasks_.empty();
                        });
                        
                        if (stop_ && tasks_.empty()) {
                            return;
                        }
                        
                        task = tasks_.front();
                        tasks_.pop();
                    }
                    task();
                }
            });
        }
        
        // Wait for all threads to be ready
        ready_latch_.wait();
        cout << "Thread pool initialized with " << num_threads << " threads" << endl;
    }

    template<class F>
    void enqueue(F&& f) {
        {
            lock_guard<mutex> lock(queue_mutex_);
            tasks_.emplace(forward<F>(f));
        }
        condition_.notify_one();
    }

    ~ThreadPool() {
        {
            lock_guard<mutex> lock(queue_mutex_);
            stop_ = true;
        }
        condition_.notify_all();
        for (auto& worker : workers_) {
            worker.join();
        }
    }
};

void threadPoolExample() {
    ThreadPool pool(4);
    
    for (int i = 0; i < 10; ++i) {
        pool.enqueue([i]() {
            cout << "Task " << i << " executed" << endl;
            this_thread::sleep_for(chrono::milliseconds(100));
        });
    }
    
    this_thread::sleep_for(chrono::milliseconds(2000));
    cout << "Thread pool example completed" << endl;
}
```

---

## Best Practices and Common Pitfalls

### 1. Latch Count Must Match Arrivals

```cpp
// GOOD: Count matches arrivals
latch sync(5);
for (int i = 0; i < 5; ++i) {
    thread([&sync]() {
        sync.arrive_and_wait();
    }).detach();
}

// BAD: Mismatch causes deadlock
latch sync(5);
for (int i = 0; i < 3; ++i) {  // Only 3 threads!
    thread([&sync]() {
        sync.arrive_and_wait();  // Deadlock - waiting forever
    }).detach();
}
```

### 2. Latch is One-Time Use

```cpp
// BAD: Trying to reuse latch
latch sync(5);
sync.arrive_and_wait();  // Works first time
sync.arrive_and_wait();  // ERROR: Latch already released!

// GOOD: Create new latch for each synchronization
for (int phase = 0; phase < 3; ++phase) {
    latch phase_sync(5);
    // Use phase_sync...
}
```

### 3. Barrier Completion Function Considerations

```cpp
// GOOD: Lightweight completion function
barrier sync(4, []() {
    cout << "All threads arrived" << endl;
});

// BAD: Heavy work in completion function blocks all threads
barrier sync(4, []() {
    // Heavy computation - blocks all threads!
    complexCalculation();
});
```

### 4. Handle Thread Dropout with arrive_and_drop()

```cpp
void dynamicBarrier() {
    barrier sync(5);
    
    vector<thread> threads;
    for (int i = 0; i < 5; ++i) {
        threads.emplace_back([&sync, i]() {
            if (i == 2) {
                // Thread 2 drops out early
                sync.arrive_and_drop();  // Reduces expected count
                return;
            }
            sync.arrive_and_wait();
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
}
```

### 5. Combine Latch and Barrier

```cpp
void combinedSync() {
    const int NUM_THREADS = 4;
    
    // Latch for one-time initialization
    latch init_latch(NUM_THREADS);
    
    // Barrier for multiple phases
    barrier phase_barrier(NUM_THREADS);
    
    vector<thread> threads;
    for (int t = 0; t < NUM_THREADS; ++t) {
        threads.emplace_back([&init_latch, &phase_barrier, t]() {
            // Initialization
            init_latch.arrive_and_wait();
            
            // Multiple phases
            for (int phase = 0; phase < 3; ++phase) {
                // Do work
                phase_barrier.arrive_and_wait();
            }
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
}
```

### 6. Error Handling

```cpp
// GOOD: Handle exceptions in threads
latch sync(5);
vector<thread> threads;

for (int i = 0; i < 5; ++i) {
    threads.emplace_back([&sync, i]() {
        try {
            // Work that might throw
            doWork();
            sync.count_down();
        } catch (...) {
            // Still count down to prevent deadlock
            sync.count_down();
        }
    });
}

sync.wait();
```

### Common Mistakes

1. **Count mismatch**: Latch count doesn't match number of arrivals
2. **Reusing latch**: Trying to use latch multiple times
3. **Deadlock**: Threads waiting forever due to missing arrivals
4. **Heavy completion function**: Blocks all threads in barrier
5. **Exception handling**: Not counting down on exceptions
6. **Race conditions**: Accessing shared data without proper synchronization

### When to Use Each

**Use std::latch when:**
- One-time synchronization needed
- Waiting for initialization to complete
- Coordinating thread startup
- Simple countdown scenario

**Use std::barrier when:**
- Multiple synchronization phases needed
- Iterative algorithms
- Multi-phase processing
- Reusable synchronization required

---

## Summary

Barriers and latches are powerful synchronization primitives in C++20:

- **std::latch**: One-time countdown synchronization
- **std::barrier**: Reusable multi-phase synchronization
- **Thread coordination**: Essential for parallel algorithms
- **Performance**: Efficient implementation in standard library

Key takeaways:
- Use latch for one-time coordination
- Use barrier for multi-phase algorithms
- Ensure count matches arrivals to avoid deadlock
- Latch cannot be reused; barrier can be reused
- Handle exceptions to prevent deadlocks
- Keep completion functions lightweight

By understanding and using barriers and latches correctly, you can implement efficient, coordinated multi-threaded algorithms in C++.

