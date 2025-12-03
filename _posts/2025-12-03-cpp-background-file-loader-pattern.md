---
layout: post
title: "C++ Background Thread File Loader: Batch Loading for Line-by-Line Consumption"
date: 2025-12-03 00:00:00 -0800
categories: cpp concurrency multithreading file-io producer-consumer
permalink: /2025/12/03/cpp-background-file-loader-pattern/
tags: [cpp, concurrency, multithreading, file-io, producer-consumer, batch-processing, background-thread]
excerpt: "Learn how to implement a background thread that loads file lines in batches while a consumer thread reads them line by line. Efficient file processing pattern with thread-safe queue."
---

# C++ Background Thread File Loader: Batch Loading for Line-by-Line Consumption

This pattern implements a background thread that reads lines from a text file in batches and feeds them to a consumer thread that processes them one by one. This approach improves performance by overlapping I/O operations with processing.

## Table of Contents

1. [Overview](#overview)
2. [Basic Implementation](#basic-implementation)
3. [Example 1: Simple Background Loader](#example-1-simple-background-loader)
4. [Example 2: Batch Loading with Buffer](#example-2-batch-loading-with-buffer)
5. [Example 3: Configurable Batch Size](#example-3-configurable-batch-size)
6. [Example 4: Error Handling and Completion](#example-4-error-handling-and-completion)
7. [Complete Working Example](#complete-working-example)
8. [Best Practices](#best-practices)

---

## Overview

### Pattern Components

- **Background Thread (Producer)**: Reads file in batches and enqueues lines
- **Consumer Thread**: Dequeues and processes lines one by one
- **Thread-Safe Queue**: Communication channel between threads
- **Batch Buffer**: Temporary storage for batch reads

### Benefits

- **Overlapped I/O**: File reading happens while processing
- **Memory Efficient**: Processes in batches, not all at once
- **Responsive**: Consumer doesn't wait for entire file load
- **Scalable**: Can handle large files efficiently

### Use Cases

- Log file processing
- Data file parsing
- Large text file analysis
- Stream processing
- ETL (Extract, Transform, Load) pipelines

---

## Basic Implementation

### Thread-Safe Queue

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
#include <optional>
#include <string>
using namespace std;

class ThreadSafeLineQueue {
private:
    queue<string> lines_;
    mutex mtx_;
    condition_variable not_empty_;
    condition_variable not_full_;
    size_t max_size_;
    bool eof_reached_;

public:
    explicit ThreadSafeLineQueue(size_t max_size = 1000) 
        : max_size_(max_size), eof_reached_(false) {}

    void push(const string& line) {
        unique_lock<mutex> lock(mtx_);
        not_full_.wait(lock, [this]() {
            return lines_.size() < max_size_ || eof_reached_;
        });
        
        if (eof_reached_) return;
        
        lines_.push(line);
        not_empty_.notify_one();
    }

    optional<string> pop() {
        unique_lock<mutex> lock(mtx_);
        not_empty_.wait(lock, [this]() {
            return !lines_.empty() || eof_reached_;
        });
        
        if (lines_.empty() && eof_reached_) {
            return nullopt;
        }
        
        string line = lines_.front();
        lines_.pop();
        not_full_.notify_one();
        return line;
    }

    void signalEOF() {
        {
            lock_guard<mutex> lock(mtx_);
            eof_reached_ = true;
        }
        not_empty_.notify_all();
        not_full_.notify_all();
    }

    bool isEOF() const {
        lock_guard<mutex> lock(mtx_);
        return eof_reached_ && lines_.empty();
    }
};
```

---

## Example 1: Simple Background Loader

Basic implementation with single batch:

```cpp
#include <fstream>
#include <thread>
#include <vector>
#include <iostream>
using namespace std;

class SimpleFileLoader {
private:
    ThreadSafeLineQueue queue_;
    thread loader_thread_;
    thread consumer_thread_;

    void loadFile(const string& filename) {
        ifstream file(filename);
        if (!file.is_open()) {
            cerr << "Failed to open file: " << filename << endl;
            queue_.signalEOF();
            return;
        }

        string line;
        vector<string> batch;
        const size_t BATCH_SIZE = 100;

        while (getline(file, line)) {
            batch.push_back(line);
            
            if (batch.size() >= BATCH_SIZE) {
                // Push batch to queue
                for (const auto& l : batch) {
                    queue_.push(l);
                }
                batch.clear();
            }
        }

        // Push remaining lines
        for (const auto& l : batch) {
            queue_.push(l);
        }

        file.close();
        queue_.signalEOF();
    }

    void consumeLines() {
        int line_count = 0;
        while (true) {
            auto line = queue_.pop();
            if (!line.has_value()) {
                break;  // EOF reached
            }
            
            // Process line
            processLine(line.value());
            line_count++;
        }
        cout << "Processed " << line_count << " lines" << endl;
    }

    void processLine(const string& line) {
        // Your processing logic here
        cout << "Processing: " << line << endl;
    }

public:
    void start(const string& filename) {
        loader_thread_ = thread([this, filename]() {
            loadFile(filename);
        });

        consumer_thread_ = thread([this]() {
            consumeLines();
        });
    }

    void wait() {
        loader_thread_.join();
        consumer_thread_.join();
    }
};

void simpleExample() {
    SimpleFileLoader loader;
    loader.start("data.txt");
    loader.wait();
}
```

---

## Example 2: Batch Loading with Buffer

More efficient batch processing:

```cpp
#include <fstream>
#include <thread>
#include <vector>
#include <atomic>
using namespace std;

class BatchFileLoader {
private:
    ThreadSafeLineQueue queue_;
    thread loader_thread_;
    thread consumer_thread_;
    atomic<int> total_lines_loaded_{0};
    atomic<int> total_lines_processed_{0};

    void loadFileInBatches(const string& filename, size_t batch_size) {
        ifstream file(filename);
        if (!file.is_open()) {
            cerr << "Failed to open file: " << filename << endl;
            queue_.signalEOF();
            return;
        }

        vector<string> batch;
        batch.reserve(batch_size);
        string line;

        while (getline(file, line)) {
            batch.push_back(move(line));
            
            if (batch.size() >= batch_size) {
                // Push entire batch
                for (auto& l : batch) {
                    queue_.push(move(l));
                    total_lines_loaded_++;
                }
                batch.clear();
                batch.reserve(batch_size);
                
                // Optional: yield to allow consumer to process
                this_thread::yield();
            }
        }

        // Push remaining lines
        for (auto& l : batch) {
            queue_.push(move(l));
            total_lines_loaded_++;
        }

        file.close();
        queue_.signalEOF();
        cout << "Loader: Finished loading " << total_lines_loaded_ << " lines" << endl;
    }

    void consumeLines() {
        while (true) {
            auto line = queue_.pop();
            if (!line.has_value()) {
                break;
            }
            
            processLine(line.value());
            total_lines_processed_++;
        }
        cout << "Consumer: Processed " << total_lines_processed_ << " lines" << endl;
    }

    void processLine(const string& line) {
        // Simulate processing
        this_thread::sleep_for(chrono::milliseconds(1));
        // Your processing logic here
    }

public:
    void start(const string& filename, size_t batch_size = 100) {
        loader_thread_ = thread([this, filename, batch_size]() {
            loadFileInBatches(filename, batch_size);
        });

        consumer_thread_ = thread([this]() {
            consumeLines();
        });
    }

    void wait() {
        loader_thread_.join();
        consumer_thread_.join();
    }

    int getTotalLoaded() const { return total_lines_loaded_.load(); }
    int getTotalProcessed() const { return total_lines_processed_.load(); }
};
```

---

## Example 3: Configurable Batch Size

Flexible batch size configuration:

```cpp
class ConfigurableFileLoader {
private:
    ThreadSafeLineQueue queue_;
    size_t batch_size_;
    atomic<bool> stop_{false};

public:
    explicit ConfigurableFileLoader(size_t batch_size = 100, size_t queue_size = 1000)
        : queue_(queue_size), batch_size_(batch_size) {}

    void loadFile(const string& filename) {
        ifstream file(filename);
        if (!file.is_open()) {
            cerr << "Failed to open file: " << filename << endl;
            queue_.signalEOF();
            return;
        }

        vector<string> batch;
        batch.reserve(batch_size_);
        string line;

        while (getline(file, line) && !stop_) {
            batch.push_back(move(line));
            
            if (batch.size() >= batch_size_) {
                pushBatch(batch);
                batch.clear();
                batch.reserve(batch_size_);
            }
        }

        // Push remaining
        if (!batch.empty()) {
            pushBatch(batch);
        }

        file.close();
        queue_.signalEOF();
    }

    void pushBatch(vector<string>& batch) {
        for (auto& line : batch) {
            queue_.push(move(line));
        }
    }

    void stop() {
        stop_ = true;
    }

    ThreadSafeLineQueue& getQueue() {
        return queue_;
    }
};

void configurableExample() {
    ConfigurableFileLoader loader(50, 500);  // Batch size 50, queue size 500
    
    thread loader_thread([&loader]() {
        loader.loadFile("data.txt");
    });

    // Consumer
    int count = 0;
    while (true) {
        auto line = loader.getQueue().pop();
        if (!line.has_value()) {
            break;
        }
        
        // Process line
        cout << "Line " << ++count << ": " << line.value() << endl;
    }

    loader_thread.join();
}
```

---

## Example 4: Error Handling and Completion

Robust implementation with error handling:

```cpp
#include <exception>
#include <stdexcept>
using namespace std;

class RobustFileLoader {
private:
    ThreadSafeLineQueue queue_;
    thread loader_thread_;
    thread consumer_thread_;
    atomic<bool> error_occurred_{false};
    string error_message_;

    void loadFile(const string& filename) {
        try {
            ifstream file(filename);
            if (!file.is_open()) {
                throw runtime_error("Failed to open file: " + filename);
            }

            vector<string> batch;
            const size_t BATCH_SIZE = 100;
            string line;

            while (getline(file, line)) {
                batch.push_back(move(line));
                
                if (batch.size() >= BATCH_SIZE) {
                    for (auto& l : batch) {
                        queue_.push(move(l));
                    }
                    batch.clear();
                }
            }

            // Push remaining
            for (auto& l : batch) {
                queue_.push(move(l));
            }

            file.close();
        } catch (const exception& e) {
            error_occurred_ = true;
            error_message_ = e.what();
            cerr << "Loader error: " << e.what() << endl;
        }
        
        queue_.signalEOF();
    }

    void consumeLines() {
        try {
            while (true) {
                auto line = queue_.pop();
                if (!line.has_value()) {
                    break;
                }
                
                try {
                    processLine(line.value());
                } catch (const exception& e) {
                    cerr << "Processing error: " << e.what() << endl;
                    // Continue processing other lines
                }
            }
        } catch (const exception& e) {
            error_occurred_ = true;
            error_message_ = e.what();
            cerr << "Consumer error: " << e.what() << endl;
        }
    }

    void processLine(const string& line) {
        // Your processing logic
        if (line.empty()) {
            return;  // Skip empty lines
        }
        // Process non-empty line
    }

public:
    void start(const string& filename) {
        loader_thread_ = thread([this, filename]() {
            loadFile(filename);
        });

        consumer_thread_ = thread([this]() {
            consumeLines();
        });
    }

    void wait() {
        loader_thread_.join();
        consumer_thread_.join();
    }

    bool hasError() const {
        return error_occurred_.load();
    }

    string getErrorMessage() const {
        return error_message_;
    }
};
```

---

## Complete Working Example

Full implementation with all features:

```cpp
#include <iostream>
#include <fstream>
#include <thread>
#include <vector>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <optional>
#include <string>
#include <atomic>
#include <chrono>
using namespace std;

class BackgroundFileLoader {
private:
    class ThreadSafeLineQueue {
    private:
        queue<string> lines_;
        mutable mutex mtx_;
        condition_variable not_empty_;
        condition_variable not_full_;
        size_t max_size_;
        atomic<bool> eof_reached_{false};

    public:
        explicit ThreadSafeLineQueue(size_t max_size = 1000) 
            : max_size_(max_size) {}

        void push(const string& line) {
            unique_lock<mutex> lock(mtx_);
            not_full_.wait(lock, [this]() {
                return lines_.size() < max_size_ || eof_reached_.load();
            });
            
            if (eof_reached_.load()) return;
            
            lines_.push(line);
            not_empty_.notify_one();
        }

        optional<string> pop() {
            unique_lock<mutex> lock(mtx_);
            not_empty_.wait(lock, [this]() {
                return !lines_.empty() || eof_reached_.load();
            });
            
            if (lines_.empty() && eof_reached_.load()) {
                return nullopt;
            }
            
            string line = move(lines_.front());
            lines_.pop();
            not_full_.notify_one();
            return line;
        }

        void signalEOF() {
            {
                lock_guard<mutex> lock(mtx_);
                eof_reached_ = true;
            }
            not_empty_.notify_all();
            not_full_.notify_all();
        }

        bool isEOF() const {
            lock_guard<mutex> lock(mtx_);
            return eof_reached_.load() && lines_.empty();
        }
    };

    ThreadSafeLineQueue queue_;
    thread loader_thread_;
    thread consumer_thread_;
    atomic<int> lines_loaded_{0};
    atomic<int> lines_processed_{0};
    atomic<bool> stop_{false};

    void loadFileInBatches(const string& filename, size_t batch_size) {
        ifstream file(filename);
        if (!file.is_open()) {
            cerr << "Error: Cannot open file " << filename << endl;
            queue_.signalEOF();
            return;
        }

        vector<string> batch;
        batch.reserve(batch_size);
        string line;

        cout << "[Loader] Starting to load file: " << filename << endl;

        while (getline(file, line) && !stop_) {
            batch.push_back(move(line));
            
            if (batch.size() >= batch_size) {
                // Push batch to queue
                for (auto& l : batch) {
                    queue_.push(move(l));
                    lines_loaded_++;
                }
                batch.clear();
                batch.reserve(batch_size);
                
                cout << "[Loader] Loaded batch, total: " << lines_loaded_ << " lines" << endl;
            }
        }

        // Push remaining lines
        if (!batch.empty()) {
            for (auto& l : batch) {
                queue_.push(move(l));
                lines_loaded_++;
            }
        }

        file.close();
        queue_.signalEOF();
        cout << "[Loader] Finished loading " << lines_loaded_ << " lines" << endl;
    }

    void consumeLines() {
        cout << "[Consumer] Starting to consume lines" << endl;
        
        while (true) {
            auto line = queue_.pop();
            if (!line.has_value()) {
                break;  // EOF reached
            }
            
            // Process line
            processLine(line.value());
            lines_processed_++;
            
            if (lines_processed_ % 100 == 0) {
                cout << "[Consumer] Processed " << lines_processed_ << " lines" << endl;
            }
        }
        
        cout << "[Consumer] Finished processing " << lines_processed_ << " lines" << endl;
    }

    void processLine(const string& line) {
        // Example processing: count characters, analyze, etc.
        if (line.empty()) {
            return;  // Skip empty lines
        }
        
        // Simulate processing time
        this_thread::sleep_for(chrono::microseconds(100));
        
        // Your actual processing logic here
        // e.g., parsing, validation, transformation, etc.
    }

public:
    BackgroundFileLoader(size_t batch_size = 100, size_t queue_size = 1000)
        : queue_(queue_size) {}

    void start(const string& filename, size_t batch_size = 100) {
        loader_thread_ = thread([this, filename, batch_size]() {
            loadFileInBatches(filename, batch_size);
        });

        consumer_thread_ = thread([this]() {
            consumeLines();
        });
    }

    void wait() {
        loader_thread_.join();
        consumer_thread_.join();
    }

    void stop() {
        stop_ = true;
    }

    int getLinesLoaded() const { return lines_loaded_.load(); }
    int getLinesProcessed() const { return lines_processed_.load(); }
};

int main() {
    cout << "=== Background File Loader Example ===" << endl << endl;

    // Create sample file for testing
    ofstream test_file("test.txt");
    for (int i = 0; i < 1000; ++i) {
        test_file << "Line " << i << ": This is test data number " << i << endl;
    }
    test_file.close();

    // Use the loader
    BackgroundFileLoader loader(50, 200);  // Batch size 50, queue size 200
    
    auto start = chrono::high_resolution_clock::now();
    loader.start("test.txt", 50);
    loader.wait();
    auto end = chrono::high_resolution_clock::now();

    auto duration = chrono::duration_cast<chrono::milliseconds>(end - start);
    
    cout << endl << "=== Summary ===" << endl;
    cout << "Lines loaded: " << loader.getLinesLoaded() << endl;
    cout << "Lines processed: " << loader.getLinesProcessed() << endl;
    cout << "Total time: " << duration.count() << " ms" << endl;

    return 0;
}
```

### Compilation

```bash
g++ -std=c++17 -pthread background_file_loader.cpp -o background_file_loader
./background_file_loader
```

---

## Best Practices

### 1. Choose Appropriate Batch Size

```cpp
// Small batch: More frequent synchronization, lower memory
size_t batch_size = 10;

// Medium batch: Balanced (recommended)
size_t batch_size = 100;

// Large batch: Less synchronization, higher memory
size_t batch_size = 1000;
```

### 2. Size Queue Appropriately

```cpp
// Queue should be larger than batch size
size_t queue_size = batch_size * 10;  // Allow multiple batches
```

### 3. Handle Errors Gracefully

```cpp
try {
    // File operations
} catch (const exception& e) {
    // Log error, signal EOF, continue
    queue_.signalEOF();
}
```

### 4. Use Move Semantics

```cpp
// GOOD: Move strings to avoid copying
batch.push_back(move(line));
queue_.push(move(l));

// BAD: Copy strings (inefficient)
batch.push_back(line);
queue_.push(l);
```

### 5. Monitor Progress

```cpp
atomic<int> lines_loaded_{0};
atomic<int> lines_processed_{0};

// Periodically report progress
if (lines_processed_ % 1000 == 0) {
    cout << "Progress: " << lines_processed_ << " lines" << endl;
}
```

### 6. Handle Large Files

```cpp
// For very large files, consider:
// - Streaming processing
// - Memory-mapped files
// - Chunked reading
```

---

## Summary

Background file loading with batch processing provides:

- **Efficient I/O**: Overlapped file reading and processing
- **Memory efficiency**: Processes in batches, not all at once
- **Responsiveness**: Consumer starts processing immediately
- **Scalability**: Handles large files efficiently

Key components:
- Background thread for file reading
- Batch buffering for efficiency
- Thread-safe queue for communication
- Consumer thread for line-by-line processing

By implementing this pattern, you can efficiently process large text files while maintaining good performance and memory usage.

