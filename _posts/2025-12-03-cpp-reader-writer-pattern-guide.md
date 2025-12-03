---
layout: post
title: "C++ Reader-Writer Pattern: Multi-Thread Synchronization Guide and Examples"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading reader-writer synchronization
permalink: /2025/12/03/cpp-reader-writer-pattern-guide/
tags: [cpp, concurrency, multithreading, reader-writer, shared-mutex, read-write-lock, synchronization, thread-safety]
excerpt: "Learn the reader-writer pattern in C++ for efficient multi-thread synchronization. Guide to implementing read-write locks, shared mutexes, and handling concurrent read and write operations."
---

# C++ Reader-Writer Pattern: Multi-Thread Synchronization Guide and Examples

The reader-writer pattern is a synchronization mechanism that allows multiple threads to read shared data simultaneously while ensuring exclusive access for write operations. This pattern is essential for scenarios where reads are frequent and writes are infrequent.

## Table of Contents

1. [What is Reader-Writer Pattern?](#what-is-reader-writer-pattern)
2. [Why Use Reader-Writer Pattern?](#why-use-reader-writer-pattern)
3. [Implementation with std::shared_mutex (C++17)](#implementation-with-stdshared_mutex-c17)
4. [Implementation with Condition Variables](#implementation-with-condition-variables)
5. [Example 1: Simple Reader-Writer](#example-1-simple-reader-writer)
6. [Example 2: Multiple Readers, Single Writer](#example-2-multiple-readers-single-writer)
7. [Example 3: Multiple Readers, Multiple Writers](#example-3-multiple-readers-multiple-writers)
8. [Example 4: Read-Heavy Workload](#example-4-read-heavy-workload)
9. [Complete Working Example](#complete-working-example)
10. [Best Practices and Common Pitfalls](#best-practices-and-common-pitfalls)

---

## What is Reader-Writer Pattern?

The reader-writer pattern provides two types of locks:

- **Shared Lock (Read Lock)**: Multiple threads can hold this lock simultaneously
- **Exclusive Lock (Write Lock)**: Only one thread can hold this lock, and it excludes all other locks

### Key Rules

1. **Multiple readers**: Any number of threads can read simultaneously
2. **Exclusive writer**: Only one writer can write at a time
3. **Reader-Writer exclusion**: No readers while a writer is active
4. **Writer-Writer exclusion**: No other writers while a writer is active

### Use Cases

- **Configuration data**: Frequently read, rarely updated
- **Caches**: Many lookups, occasional updates
- **Databases**: Read queries are common, writes are less frequent
- **Lookup tables**: Read-heavy data structures
- **Shared state**: Multiple threads reading, few threads updating

---

## Why Use Reader-Writer Pattern?

### Performance Benefits

```cpp
// BAD: Using regular mutex - all readers block each other
mutex mtx;
void read() {
    lock_guard<mutex> lock(mtx);  // Blocks other readers!
    // read data
}

// GOOD: Using shared_mutex - readers don't block each other
shared_mutex mtx;
void read() {
    shared_lock<shared_mutex> lock(mtx);  // Allows other readers
    // read data
}
```

### Performance Comparison

- **Regular mutex**: All operations serialize (readers block readers)
- **Shared mutex**: Readers run in parallel, only writers serialize
- **Benefit**: Can be 10-100x faster for read-heavy workloads

---

## Implementation with std::shared_mutex (C++17)

C++17 provides `std::shared_mutex` for efficient reader-writer synchronization:

```cpp
#include <shared_mutex>
#include <mutex>
#include <map>
#include <string>
using namespace std;

class ThreadSafeMap {
private:
    map<string, int> data_;
    shared_mutex rw_mutex_;

public:
    // Read operation - uses shared lock
    int get(const string& key) {
        shared_lock<shared_mutex> lock(rw_mutex_);
        auto it = data_.find(key);
        if (it != data_.end()) {
            return it->second;
        }
        return -1;  // Not found
    }

    // Write operation - uses exclusive lock
    void set(const string& key, int value) {
        unique_lock<shared_mutex> lock(rw_mutex_);
        data_[key] = value;
    }

    // Read operation - check if key exists
    bool contains(const string& key) {
        shared_lock<shared_mutex> lock(rw_mutex_);
        return data_.find(key) != data_.end();
    }

    // Write operation - remove key
    void remove(const string& key) {
        unique_lock<shared_mutex> lock(rw_mutex_);
        data_.erase(key);
    }

    // Read operation - get all keys
    vector<string> getAllKeys() {
        shared_lock<shared_mutex> lock(rw_mutex_);
        vector<string> keys;
        for (const auto& pair : data_) {
            keys.push_back(pair.first);
        }
        return keys;
    }
};
```

### Lock Types

- **`shared_lock<shared_mutex>`**: For read operations (allows concurrent reads)
- **`unique_lock<shared_mutex>`**: For write operations (exclusive access)
- **`lock_guard<shared_mutex>`**: Also works for exclusive writes

---

## Implementation with Condition Variables

For C++14 or when you need more control, implement using condition variables:

```cpp
#include <mutex>
#include <condition_variable>
#include <atomic>
using namespace std;

class ReaderWriterLock {
private:
    mutex mtx_;
    condition_variable readers_cv_;
    condition_variable writers_cv_;
    atomic<int> active_readers_{0};
    atomic<int> waiting_writers_{0};
    atomic<bool> writer_active_{false};

public:
    void lock_read() {
        unique_lock<mutex> lock(mtx_);
        readers_cv_.wait(lock, [this]() {
            return waiting_writers_ == 0 && !writer_active_;
        });
        active_readers_++;
    }

    void unlock_read() {
        lock_guard<mutex> lock(mtx_);
        active_readers_--;
        if (active_readers_ == 0) {
            writers_cv_.notify_one();
        }
    }

    void lock_write() {
        unique_lock<mutex> lock(mtx_);
        waiting_writers_++;
        writers_cv_.wait(lock, [this]() {
            return active_readers_ == 0 && !writer_active_;
        });
        waiting_writers_--;
        writer_active_ = true;
    }

    void unlock_write() {
        lock_guard<mutex> lock(mtx_);
        writer_active_ = false;
        if (waiting_writers_ > 0) {
            writers_cv_.notify_one();
        } else {
            readers_cv_.notify_all();
        }
    }
};

// RAII wrapper for read lock
class ReadLock {
private:
    ReaderWriterLock& rw_lock_;

public:
    explicit ReadLock(ReaderWriterLock& rw_lock) : rw_lock_(rw_lock) {
        rw_lock_.lock_read();
    }
    ~ReadLock() {
        rw_lock_.unlock_read();
    }
};

// RAII wrapper for write lock
class WriteLock {
private:
    ReaderWriterLock& rw_lock_;

public:
    explicit WriteLock(ReaderWriterLock& rw_lock) : rw_lock_(rw_lock) {
        rw_lock_.lock_write();
    }
    ~WriteLock() {
        rw_lock_.unlock_write();
    }
};
```

---

## Example 1: Simple Reader-Writer

Basic example with one reader and one writer:

```cpp
#include <iostream>
#include <thread>
#include <chrono>
#include <shared_mutex>
#include <string>
using namespace std;

class SharedData {
private:
    string data_ = "Initial";
    shared_mutex rw_mutex_;

public:
    string read() {
        shared_lock<shared_mutex> lock(rw_mutex_);
        cout << "Reader: reading " << data_ << endl;
        this_thread::sleep_for(chrono::milliseconds(100));
        return data_;
    }

    void write(const string& new_data) {
        unique_lock<shared_mutex> lock(rw_mutex_);
        cout << "Writer: writing " << new_data << endl;
        this_thread::sleep_for(chrono::milliseconds(200));
        data_ = new_data;
        cout << "Writer: wrote " << data_ << endl;
    }
};

void simpleReaderWriter() {
    SharedData shared_data;

    // Writer thread
    thread writer([&shared_data]() {
        for (int i = 1; i <= 5; ++i) {
            shared_data.write("Data-" + to_string(i));
            this_thread::sleep_for(chrono::milliseconds(300));
        }
    });

    // Reader thread
    thread reader([&shared_data]() {
        for (int i = 0; i < 10; ++i) {
            shared_data.read();
            this_thread::sleep_for(chrono::milliseconds(150));
        }
    });

    writer.join();
    reader.join();
    cout << "Simple reader-writer completed!" << endl;
}
```

---

## Example 2: Multiple Readers, Single Writer

Multiple readers can read simultaneously while writer has exclusive access:

```cpp
#include <vector>
#include <atomic>
using namespace std;

void multipleReadersSingleWriter() {
    SharedData shared_data;
    atomic<bool> writer_done(false);
    const int NUM_READERS = 5;

    // Single writer thread
    thread writer([&shared_data, &writer_done]() {
        for (int i = 1; i <= 10; ++i) {
            shared_data.write("Update-" + to_string(i));
            this_thread::sleep_for(chrono::milliseconds(500));
        }
        writer_done = true;
        cout << "Writer finished" << endl;
    });

    // Multiple reader threads
    vector<thread> readers;
    for (int r = 0; r < NUM_READERS; ++r) {
        readers.emplace_back([&shared_data, r, &writer_done]() {
            int read_count = 0;
            while (!writer_done || read_count < 20) {
                string data = shared_data.read();
                read_count++;
                cout << "Reader-" << r << " read: " << data 
                     << " (total reads: " << read_count << ")" << endl;
                this_thread::sleep_for(chrono::milliseconds(100 + r * 20));
            }
            cout << "Reader-" << r << " finished" << endl;
        });
    }

    writer.join();
    for (auto& t : readers) {
        t.join();
    }
    cout << "Multiple readers, single writer completed!" << endl;
}
```

### Output Behavior

- Multiple readers can read simultaneously (no blocking)
- When writer writes, all readers wait
- After write completes, all readers can read again in parallel

---

## Example 3: Multiple Readers, Multiple Writers

Handling multiple writers with proper synchronization:

```cpp
void multipleReadersMultipleWriters() {
    SharedData shared_data;
    atomic<int> active_writers(3);
    atomic<int> total_writes(0);
    const int NUM_READERS = 4;
    const int NUM_WRITERS = 3;

    // Multiple writer threads
    vector<thread> writers;
    for (int w = 0; w < NUM_WRITERS; ++w) {
        writers.emplace_back([&shared_data, w, &active_writers, &total_writes]() {
            for (int i = 1; i <= 5; ++i) {
                string data = "Writer-" + to_string(w) + "-Data-" + to_string(i);
                shared_data.write(data);
                total_writes++;
                this_thread::sleep_for(chrono::milliseconds(400 + w * 50));
            }
            active_writers--;
            cout << "Writer-" << w << " finished" << endl;
        });
    }

    // Multiple reader threads
    vector<thread> readers;
    for (int r = 0; r < NUM_READERS; ++r) {
        readers.emplace_back([&shared_data, r, &active_writers]() {
            int read_count = 0;
            while (active_writers > 0 || read_count < 15) {
                string data = shared_data.read();
                read_count++;
                cout << "Reader-" << r << ": " << data << endl;
                this_thread::sleep_for(chrono::milliseconds(80 + r * 15));
            }
            cout << "Reader-" << r << " finished (read " << read_count << " times)" << endl;
        });
    }

    for (auto& t : writers) {
        t.join();
    }
    for (auto& t : readers) {
        t.join();
    }
    
    cout << "Total writes: " << total_writes << endl;
    cout << "Multiple readers, multiple writers completed!" << endl;
}
```

### Synchronization Behavior

- **Readers**: Can read simultaneously when no writer is active
- **Writers**: Must wait for all readers to finish, then get exclusive access
- **Writer priority**: Writers wait for current readers, then block new readers

---

## Example 4: Read-Heavy Workload

Demonstrating performance benefit with many concurrent readers:

```cpp
#include <chrono>
#include <atomic>
using namespace std;
using namespace chrono;

void readHeavyWorkload() {
    SharedData shared_data;
    atomic<int> total_reads(0);
    const int NUM_READERS = 20;
    const int READS_PER_READER = 100;

    // Periodic writer (infrequent updates)
    thread writer([&shared_data]() {
        for (int i = 1; i <= 5; ++i) {
            this_thread::sleep_for(chrono::milliseconds(2000));
            shared_data.write("Periodic-Update-" + to_string(i));
        }
        cout << "Writer finished" << endl;
    });

    // Many reader threads
    vector<thread> readers;
    auto start = high_resolution_clock::now();
    
    for (int r = 0; r < NUM_READERS; ++r) {
        readers.emplace_back([&shared_data, r, &total_reads]() {
            for (int i = 0; i < READS_PER_READER; ++i) {
                shared_data.read();
                total_reads++;
                this_thread::sleep_for(chrono::microseconds(100));
            }
        });
    }

    for (auto& t : readers) {
        t.join();
    }
    
    auto end = high_resolution_clock::now();
    auto duration = duration_cast<milliseconds>(end - start);
    
    writer.join();
    
    cout << "Total reads: " << total_reads << endl;
    cout << "Time taken: " << duration.count() << " ms" << endl;
    cout << "Reads per second: " << (total_reads * 1000.0 / duration.count()) << endl;
    cout << "Read-heavy workload completed!" << endl;
}
```

### Performance Benefits

With `shared_mutex`, 20 readers can read simultaneously, dramatically improving throughput compared to a regular mutex where readers would block each other.

---

## Complete Working Example

Complete, runnable example demonstrating reader-writer pattern:

```cpp
#include <iostream>
#include <thread>
#include <chrono>
#include <shared_mutex>
#include <vector>
#include <string>
#include <atomic>
#include <map>
using namespace std;

class ThreadSafeCache {
private:
    map<string, string> cache_;
    shared_mutex rw_mutex_;

public:
    // Read operation
    string get(const string& key) {
        shared_lock<shared_mutex> lock(rw_mutex_);
        auto it = cache_.find(key);
        if (it != cache_.end()) {
            return it->second;
        }
        return "NOT_FOUND";
    }

    // Write operation
    void put(const string& key, const string& value) {
        unique_lock<shared_mutex> lock(rw_mutex_);
        cache_[key] = value;
    }

    // Read operation - check existence
    bool exists(const string& key) {
        shared_lock<shared_mutex> lock(rw_mutex_);
        return cache_.find(key) != cache_.end();
    }

    // Write operation - remove
    void remove(const string& key) {
        unique_lock<shared_mutex> lock(rw_mutex_);
        cache_.erase(key);
    }

    // Read operation - get size
    size_t size() {
        shared_lock<shared_mutex> lock(rw_mutex_);
        return cache_.size();
    }
};

int main() {
    cout << "=== Reader-Writer Pattern Demo ===" << endl << endl;

    ThreadSafeCache cache;
    atomic<int> read_count(0);
    atomic<int> write_count(0);
    const int NUM_READERS = 5;
    const int NUM_WRITERS = 2;

    // Writer threads
    vector<thread> writers;
    for (int w = 0; w < NUM_WRITERS; ++w) {
        writers.emplace_back([&cache, w, &write_count]() {
            for (int i = 0; i < 10; ++i) {
                string key = "key-" + to_string(w) + "-" + to_string(i);
                string value = "value-" + to_string(w) + "-" + to_string(i);
                cache.put(key, value);
                write_count++;
                cout << "[Writer-" << w << "] Wrote: " << key << " = " << value << endl;
                this_thread::sleep_for(chrono::milliseconds(200));
            }
            cout << "[Writer-" << w << "] Finished" << endl;
        });
    }

    // Reader threads
    vector<thread> readers;
    for (int r = 0; r < NUM_READERS; ++r) {
        readers.emplace_back([&cache, r, &read_count]() {
            for (int i = 0; i < 20; ++i) {
                string key = "key-" + to_string(i % 2) + "-" + to_string(i % 10);
                string value = cache.get(key);
                read_count++;
                if (value != "NOT_FOUND") {
                    cout << "[Reader-" << r << "] Read: " << key << " = " << value << endl;
                }
                this_thread::sleep_for(chrono::milliseconds(100));
            }
            cout << "[Reader-" << r << "] Finished" << endl;
        });
    }

    // Wait for all threads
    for (auto& t : writers) {
        t.join();
    }
    for (auto& t : readers) {
        t.join();
    }

    cout << endl << "Cache size: " << cache.size() << endl;
    cout << "Total reads: " << read_count << endl;
    cout << "Total writes: " << write_count << endl;
    cout << "Demo completed!" << endl;

    return 0;
}
```

### Compilation

```bash
g++ -std=c++17 -pthread reader_writer.cpp -o reader_writer
./reader_writer
```

---

## Best Practices and Common Pitfalls

### 1. Always Use RAII Locks

```cpp
// GOOD: Automatic unlock
{
    shared_lock<shared_mutex> lock(rw_mutex_);
    // read data
}  // Automatically unlocked

// BAD: Manual lock/unlock (error-prone)
rw_mutex_.lock_shared();
// ... if exception occurs, lock never released!
rw_mutex_.unlock_shared();
```

### 2. Don't Upgrade Read Lock to Write Lock

```cpp
// BAD: Deadlock risk
shared_lock<shared_mutex> read_lock(rw_mutex_);
// ... read operations ...
unique_lock<shared_mutex> write_lock(rw_mutex_);  // DEADLOCK!

// GOOD: Release read lock first
{
    shared_lock<shared_mutex> read_lock(rw_mutex_);
    // read operations
}  // Read lock released
unique_lock<shared_mutex> write_lock(rw_mutex_);  // Now safe
```

### 3. Use Appropriate Lock Type

```cpp
// GOOD: Use shared_lock for reads
shared_lock<shared_mutex> lock(rw_mutex_);
int value = data_;

// BAD: Using unique_lock for reads (unnecessary blocking)
unique_lock<shared_mutex> lock(rw_mutex_);  // Blocks other readers!
int value = data_;
```

### 4. Avoid Writer Starvation

For fairness, consider writer-priority implementations:

```cpp
class FairReaderWriterLock {
private:
    mutex mtx_;
    condition_variable readers_cv_;
    condition_variable writers_cv_;
    int active_readers_ = 0;
    int waiting_writers_ = 0;
    bool writer_active_ = false;

public:
    void lock_read() {
        unique_lock<mutex> lock(mtx_);
        // Wait if writer is waiting (prevents starvation)
        readers_cv_.wait(lock, [this]() {
            return waiting_writers_ == 0 && !writer_active_;
        });
        active_readers_++;
    }

    void lock_write() {
        unique_lock<mutex> lock(mtx_);
        waiting_writers_++;
        writers_cv_.wait(lock, [this]() {
            return active_readers_ == 0 && !writer_active_;
        });
        waiting_writers_--;
        writer_active_ = true;
    }
    // ... unlock methods
};
```

### 5. Consider Read-to-Write Upgrade Pattern

```cpp
class UpgradeableLock {
private:
    shared_mutex rw_mutex_;
    bool has_read_lock_ = false;

public:
    void lock_read() {
        rw_mutex_.lock_shared();
        has_read_lock_ = true;
    }

    bool try_upgrade_to_write() {
        if (!has_read_lock_) return false;
        rw_mutex_.unlock_shared();
        rw_mutex_.lock();
        has_read_lock_ = false;
        return true;
    }
};
```

### 6. Performance Considerations

- **Read-heavy**: Reader-writer pattern provides significant speedup
- **Write-heavy**: Regular mutex may be faster (less overhead)
- **Balanced**: Profile to determine which is better
- **Cache line**: Consider false sharing when multiple readers access adjacent data

### Common Mistakes

1. **Using unique_lock for reads**: Unnecessarily blocks other readers
2. **Deadlock from lock upgrade**: Trying to acquire write lock while holding read lock
3. **Forgotten unlocks**: Always use RAII wrappers
4. **Writer starvation**: Implement fairness if needed
5. **Not checking C++17 support**: `shared_mutex` requires C++17

### When NOT to Use Reader-Writer Pattern

- **Write-heavy workloads**: Regular mutex may be simpler and faster
- **Simple critical sections**: Overhead not worth it
- **C++14 or earlier**: Need custom implementation
- **Lock-free requirements**: Consider atomic operations instead

---

## Summary

The reader-writer pattern is essential for efficient concurrent access to shared data:

- **Allows concurrent reads**: Multiple threads can read simultaneously
- **Exclusive writes**: Writers get exclusive access when needed
- **Performance benefit**: 10-100x faster for read-heavy workloads
- **C++17 support**: Use `std::shared_mutex` for standard implementation

Key implementation points:
- Use `shared_lock` for read operations
- Use `unique_lock` for write operations
- Always use RAII wrappers
- Don't upgrade read locks to write locks
- Consider fairness to prevent writer starvation

By following these examples and best practices, you can implement efficient, thread-safe reader-writer synchronization in C++.

