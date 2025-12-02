---
layout: post
title: "C++ Function Pointers Complete Guide: Syntax, Scenarios, Examples, and Common Pitfalls"
date: 2025-12-02 00:00:00 -0800
categories: cpp programming function-pointers pointers callbacks
permalink: /2025/12/02/cpp-function-pointers-complete-guide/
tags: [cpp, function-pointers, pointers, callbacks, member-function-pointers, function-objects, function-signatures]
excerpt: "A comprehensive guide to C++ function pointers covering syntax, declaration, member function pointers, use cases, practical examples, and common pitfalls."
---

# C++ Function Pointers Complete Guide: Syntax, Scenarios, Examples, and Common Pitfalls

Function pointers in C++ allow you to store and pass functions as values, enabling callbacks, function tables, and dynamic function dispatch. This guide covers function pointer syntax, member function pointers, practical scenarios, examples, and common mistakes.

## Table of Contents

1. [Introduction to Function Pointers](#introduction-to-function-pointers)
2. [Basic Function Pointer Syntax](#basic-function-pointer-syntax)
3. [Function Pointer Declaration](#function-pointer-declaration)
4. [Using Function Pointers](#using-function-pointers)
5. [Member Function Pointers](#member-function-pointers)
6. [Function Pointer Arrays](#function-pointer-arrays)
7. [Common Scenarios](#common-scenarios)
8. [Practical Examples](#practical-examples)
9. [Common Practices](#common-practices)
10. [Common Pitfalls and Mistakes](#common-pitfalls-and-mistakes)

---

## Introduction to Function Pointers

### What Are Function Pointers?

A function pointer is a variable that stores the address of a function. It allows you to:
- Pass functions as arguments to other functions
- Store functions in data structures
- Call functions dynamically at runtime
- Implement callbacks and event handlers

### Why Use Function Pointers?

```cpp
#include <iostream>
using namespace std;

// Without function pointers: hardcoded behavior
void processNumbers1(int* arr, int size) {
    for (int i = 0; i < size; ++i) {
        arr[i] = arr[i] * 2;  // Hardcoded operation
    }
}

// With function pointers: flexible behavior
void processNumbers2(int* arr, int size, int (*operation)(int)) {
    for (int i = 0; i < size; ++i) {
        arr[i] = operation(arr[i]);  // User-defined operation
    }
}

int square(int x) { return x * x; }
int doubleValue(int x) { return x * 2; }

int main() {
    int arr[] = {1, 2, 3, 4, 5};
    
    processNumbers2(arr, 5, square);      // Square each element
    processNumbers2(arr, 5, doubleValue);  // Double each element
}
```

---

## Basic Function Pointer Syntax

### Simple Function Pointer

```cpp
#include <iostream>
using namespace std;

int add(int a, int b) {
    return a + b;
}

int multiply(int a, int b) {
    return a * b;
}

void basicSyntax() {
    // Declare function pointer
    int (*funcPtr)(int, int);
    
    // Assign function address
    funcPtr = add;
    
    // Call through function pointer
    int result = funcPtr(3, 4);  // 7
    cout << result << endl;
    
    // Reassign to different function
    funcPtr = multiply;
    result = funcPtr(3, 4);  // 12
    cout << result << endl;
}
```

### Function Pointer Syntax Breakdown

```cpp
// Syntax: return_type (*pointer_name)(parameter_types)

int (*ptr)(int, int);
//  ^    ^   ^   ^
//  |    |   |   └─ Parameter types
//  |    |   └───── Function name (pointer)
//  |    └───────── Dereference operator
//  └────────────── Return type

// Examples:
void (*voidFunc)();                    // No parameters, void return
int (*intFunc)(int);                    // One int parameter, int return
double (*doubleFunc)(int, double);      // Two parameters, double return
```

---

## Function Pointer Declaration

### Direct Declaration

```cpp
void directDeclaration() {
    // Declare and initialize
    int (*funcPtr)(int, int) = add;
    
    // Or declare first, assign later
    int (*funcPtr2)(int, int);
    funcPtr2 = add;
}
```

### Using Typedef/Using

```cpp
#include <iostream>
using namespace std;

int add(int a, int b) { return a + b; }
int subtract(int a, int b) { return a - b; }

// Using typedef (C style)
typedef int (*MathFunc)(int, int);

// Using using (C++ style, preferred)
using MathFunc = int (*)(int, int);

void typedefExample() {
    MathFunc func = add;
    int result = func(10, 5);  // 15
    
    func = subtract;
    result = func(10, 5);  // 5
}
```

### Function Pointer as Parameter

```cpp
#include <iostream>
using namespace std;

int add(int a, int b) { return a + b; }
int multiply(int a, int b) { return a * b; }

// Function taking function pointer as parameter
int calculate(int a, int b, int (*operation)(int, int)) {
    return operation(a, b);
}

void parameterExample() {
    int sum = calculate(5, 3, add);           // 8
    int product = calculate(5, 3, multiply);  // 15
    
    cout << "Sum: " << sum << endl;
    cout << "Product: " << product << endl;
}
```

### Function Returning Function Pointer

```cpp
#include <iostream>
using namespace std;

int add(int a, int b) { return a + b; }
int subtract(int a, int b) { return a - b; }

// Function returning function pointer
int (*getOperation(bool isAdd))(int, int) {
    return isAdd ? add : subtract;
}

// More readable with typedef/using
using Operation = int (*)(int, int);

Operation getOperation2(bool isAdd) {
    return isAdd ? add : subtract;
}

void returnExample() {
    Operation op = getOperation2(true);
    int result = op(10, 5);  // 15
    
    op = getOperation2(false);
    result = op(10, 5);  // 5
}
```

---

## Using Function Pointers

### Calling Functions Through Pointers

```cpp
#include <iostream>
using namespace std;

void greet() {
    cout << "Hello!" << endl;
}

void farewell() {
    cout << "Goodbye!" << endl;
}

void callingExample() {
    void (*func)() = greet;
    
    // Method 1: Direct call
    func();
    
    // Method 2: Explicit dereference
    (*func)();
    
    // Both are equivalent
}
```

### Function Pointer Comparison

```cpp
#include <iostream>
using namespace std;

int add(int a, int b) { return a + b; }

void comparisonExample() {
    int (*ptr1)(int, int) = add;
    int (*ptr2)(int, int) = add;
    
    // Compare function pointers
    if (ptr1 == ptr2) {
        cout << "Pointers are equal" << endl;
    }
    
    // Compare with nullptr
    int (*ptr3)(int, int) = nullptr;
    if (ptr3 == nullptr) {
        cout << "Pointer is null" << endl;
    }
}
```

### Null Function Pointers

```cpp
#include <iostream>
using namespace std;

void safeCall(void (*func)()) {
    if (func != nullptr) {
        func();
    } else {
        cout << "Function pointer is null" << endl;
    }
}

void nullExample() {
    void (*func)() = nullptr;
    safeCall(func);  // Checks for null
    
    func = []() { cout << "Called!" << endl; };
    safeCall(func);  // Executes function
}
```

---

## Member Function Pointers

### Basic Member Function Pointer

```cpp
#include <iostream>
using namespace std;

class Calculator {
public:
    int add(int a, int b) { return a + b; }
    int multiply(int a, int b) { return a * b; }
    static int subtract(int a, int b) { return a - b; }
};

void memberFunctionPointer() {
    Calculator calc;
    
    // Member function pointer syntax
    int (Calculator::*memberFunc)(int, int) = &Calculator::add;
    
    // Call through object
    int result = (calc.*memberFunc)(5, 3);  // 8
    cout << result << endl;
    
    // Reassign
    memberFunc = &Calculator::multiply;
    result = (calc.*memberFunc)(5, 3);  // 15
    cout << result << endl;
}
```

### Member Function Pointer with Typedef

```cpp
#include <iostream>
using namespace std;

class Math {
public:
    int add(int a, int b) { return a + b; }
    int subtract(int a, int b) { return a - b; }
};

using MathFunc = int (Math::*)(int, int);

void typedefMemberExample() {
    Math math;
    MathFunc func = &Math::add;
    
    int result = (math.*func)(10, 5);  // 15
    cout << result << endl;
}
```

### Static Member Function Pointers

```cpp
#include <iostream>
using namespace std;

class Utils {
public:
    static int add(int a, int b) { return a + b; }
    static int multiply(int a, int b) { return a * b; }
};

void staticMemberExample() {
    // Static member functions use regular function pointer syntax
    int (*func)(int, int) = Utils::add;
    
    int result = func(5, 3);  // 8
    cout << result << endl;
}
```

### Member Function Pointer in Containers

```cpp
#include <vector>
#include <iostream>
using namespace std;

class Processor {
public:
    void process1() { cout << "Process 1" << endl; }
    void process2() { cout << "Process 2" << endl; }
    void process3() { cout << "Process 3" << endl; }
};

void containerExample() {
    Processor proc;
    vector<void (Processor::*)()> functions = {
        &Processor::process1,
        &Processor::process2,
        &Processor::process3
    };
    
    for (auto func : functions) {
        (proc.*func)();
    }
}
```

---

## Function Pointer Arrays

### Array of Function Pointers

```cpp
#include <iostream>
using namespace std;

int add(int a, int b) { return a + b; }
int subtract(int a, int b) { return a - b; }
int multiply(int a, int b) { return a * b; }

void arrayExample() {
    // Array of function pointers
    int (*operations[])(int, int) = {add, subtract, multiply};
    
    int a = 10, b = 5;
    
    cout << "Add: " << operations[0](a, b) << endl;       // 15
    cout << "Subtract: " << operations[1](a, b) << endl;   // 5
    cout << "Multiply: " << operations[2](a, b) << endl;    // 50
}
```

### Function Pointer Lookup Table

```cpp
#include <iostream>
#include <map>
#include <string>
using namespace std;

int add(int a, int b) { return a + b; }
int subtract(int a, int b) { return a - b; }
int multiply(int a, int b) { return a * b; }
int divide(int a, int b) { return b != 0 ? a / b : 0; }

void lookupTableExample() {
    map<string, int (*)(int, int)> operations = {
        {"add", add},
        {"subtract", subtract},
        {"multiply", multiply},
        {"divide", divide}
    };
    
    string op = "multiply";
    if (operations.find(op) != operations.end()) {
        int result = operations[op](10, 5);
        cout << "Result: " << result << endl;  // 50
    }
}
```

---

## Common Scenarios

### Scenario 1: Callback Functions

```cpp
#include <iostream>
#include <vector>
using namespace std;

class EventHandler {
public:
    using Callback = void (*)();
    
    void registerCallback(Callback cb) {
        callbacks_.push_back(cb);
    }
    
    void trigger() {
        for (auto cb : callbacks_) {
            cb();
        }
    }
    
private:
    vector<Callback> callbacks_;
};

void onEvent1() { cout << "Event 1 handled" << endl; }
void onEvent2() { cout << "Event 2 handled" << endl; }

void callbackScenario() {
    EventHandler handler;
    handler.registerCallback(onEvent1);
    handler.registerCallback(onEvent2);
    
    handler.trigger();
}
```

### Scenario 2: Strategy Pattern

```cpp
#include <iostream>
#include <vector>
using namespace std;

class Sorter {
public:
    using CompareFunc = bool (*)(int, int);
    
    void sort(vector<int>& data, CompareFunc compare) {
        // Simple bubble sort using compare function
        for (size_t i = 0; i < data.size(); ++i) {
            for (size_t j = 0; j < data.size() - i - 1; ++j) {
                if (compare(data[j + 1], data[j])) {
                    swap(data[j], data[j + 1]);
                }
            }
        }
    }
};

bool ascending(int a, int b) { return a < b; }
bool descending(int a, int b) { return a > b; }

void strategyExample() {
    vector<int> data = {3, 1, 4, 1, 5, 9, 2, 6};
    
    Sorter sorter;
    sorter.sort(data, ascending);
    // data is now sorted ascending
    
    sorter.sort(data, descending);
    // data is now sorted descending
}
```

### Scenario 3: Function Dispatcher

```cpp
#include <iostream>
#include <map>
using namespace std;

class CommandDispatcher {
    using CommandFunc = void (*)(const string&);
    map<string, CommandFunc> commands_;
    
public:
    void registerCommand(const string& name, CommandFunc func) {
        commands_[name] = func;
    }
    
    void execute(const string& name, const string& arg) {
        if (commands_.find(name) != commands_.end()) {
            commands_[name](arg);
        } else {
            cout << "Unknown command: " << name << endl;
        }
    }
};

void printCommand(const string& arg) {
    cout << "Print: " << arg << endl;
}

void echoCommand(const string& arg) {
    cout << "Echo: " << arg << endl;
}

void dispatcherExample() {
    CommandDispatcher dispatcher;
    dispatcher.registerCommand("print", printCommand);
    dispatcher.registerCommand("echo", echoCommand);
    
    dispatcher.execute("print", "Hello");
    dispatcher.execute("echo", "World");
}
```

### Scenario 4: Plugin System

```cpp
#include <iostream>
#include <vector>
using namespace std;

class PluginManager {
    using PluginInit = void (*)();
    using PluginProcess = void (*)(const string&);
    using PluginCleanup = void (*)();
    
    struct Plugin {
        PluginInit init;
        PluginProcess process;
        PluginCleanup cleanup;
    };
    
    vector<Plugin> plugins_;
    
public:
    void registerPlugin(PluginInit init, PluginProcess process, PluginCleanup cleanup) {
        plugins_.push_back({init, process, cleanup});
    }
    
    void initializeAll() {
        for (auto& plugin : plugins_) {
            plugin.init();
        }
    }
    
    void processAll(const string& data) {
        for (auto& plugin : plugins_) {
            plugin.process(data);
        }
    }
    
    void cleanupAll() {
        for (auto& plugin : plugins_) {
            plugin.cleanup();
        }
    }
};

void plugin1Init() { cout << "Plugin 1 initialized" << endl; }
void plugin1Process(const string& data) { cout << "Plugin 1: " << data << endl; }
void plugin1Cleanup() { cout << "Plugin 1 cleaned up" << endl; }

void pluginExample() {
    PluginManager manager;
    manager.registerPlugin(plugin1Init, plugin1Process, plugin1Cleanup);
    
    manager.initializeAll();
    manager.processAll("test data");
    manager.cleanupAll();
}
```

### Scenario 5: State Machine

```cpp
#include <iostream>
using namespace std;

class StateMachine {
    using StateFunc = void (*)(StateMachine&);
    
    StateFunc currentState_;
    
public:
    StateMachine() : currentState_(stateIdle) {}
    
    void update() {
        currentState_(*this);
    }
    
    static void stateIdle(StateMachine& sm) {
        cout << "State: Idle" << endl;
        sm.currentState_ = stateActive;
    }
    
    static void stateActive(StateMachine& sm) {
        cout << "State: Active" << endl;
        sm.currentState_ = stateIdle;
    }
};

void stateMachineExample() {
    StateMachine sm;
    
    for (int i = 0; i < 5; ++i) {
        sm.update();
    }
}
```

---

## Practical Examples

### Example 1: Generic Filter Function

```cpp
#include <iostream>
#include <vector>
using namespace std;

template<typename T>
vector<T> filter(const vector<T>& data, bool (*predicate)(const T&)) {
    vector<T> result;
    for (const auto& item : data) {
        if (predicate(item)) {
            result.push_back(item);
        }
    }
    return result;
}

bool isEven(int n) { return n % 2 == 0; }
bool isPositive(int n) { return n > 0; }

void filterExample() {
    vector<int> data = {-2, -1, 0, 1, 2, 3, 4, 5};
    
    auto evens = filter(data, isEven);
    // evens: -2, 0, 2, 4
    
    auto positives = filter(data, isPositive);
    // positives: 1, 2, 3, 4, 5
}
```

### Example 2: Comparator Factory

```cpp
#include <iostream>
#include <algorithm>
#include <vector>
using namespace std;

class ComparatorFactory {
public:
    using CompareFunc = bool (*)(int, int);
    
    static CompareFunc getAscending() {
        return [](int a, int b) { return a < b; };
    }
    
    static CompareFunc getDescending() {
        return [](int a, int b) { return a > b; };
    }
    
    static CompareFunc getAbsolute() {
        return [](int a, int b) { return abs(a) < abs(b); };
    }
};

void comparatorExample() {
    vector<int> data = {-3, 1, -4, 2, 0};
    
    sort(data.begin(), data.end(), ComparatorFactory::getAscending());
    // -4, -3, 0, 1, 2
    
    sort(data.begin(), data.end(), ComparatorFactory::getAbsolute());
    // 0, 1, 2, -3, -4
}
```

### Example 3: Event System

```cpp
#include <iostream>
#include <vector>
#include <string>
using namespace std;

class EventSystem {
    using EventHandler = void (*)(const string&);
    vector<EventHandler> handlers_;
    
public:
    void subscribe(EventHandler handler) {
        handlers_.push_back(handler);
    }
    
    void publish(const string& event) {
        for (auto handler : handlers_) {
            handler(event);
        }
    }
};

void logger(const string& event) {
    cout << "[LOG] " << event << endl;
}

void notifier(const string& event) {
    cout << "[NOTIFY] " << event << endl;
}

void eventExample() {
    EventSystem events;
    events.subscribe(logger);
    events.subscribe(notifier);
    
    events.publish("User logged in");
    events.publish("Data updated");
}
```

### Example 4: Mathematical Operations

```cpp
#include <iostream>
#include <cmath>
using namespace std;

class MathOperations {
public:
    using UnaryOp = double (*)(double);
    using BinaryOp = double (*)(double, double);
    
    static double apply(UnaryOp op, double x) {
        return op(x);
    }
    
    static double apply(BinaryOp op, double x, double y) {
        return op(x, y);
    }
};

void mathExample() {
    // Unary operations
    double result1 = MathOperations::apply(sin, 3.14159 / 2);  // 1.0
    double result2 = MathOperations::apply(cos, 0);            // 1.0
    
    // Binary operations
    double result3 = MathOperations::apply(pow, 2.0, 3.0);     // 8.0
    double result4 = MathOperations::apply(fmod, 10.0, 3.0);  // 1.0
}
```

---

## Common Practices

### 1. Use Typedef/Using for Readability

```cpp
// Good: Clear and readable
using CompareFunc = bool (*)(int, int);
CompareFunc func = ascending;

// Bad: Hard to read
bool (*func)(int, int) = ascending;
```

### 2. Always Check for Null

```cpp
// Good: Safe call
void safeCall(void (*func)()) {
    if (func != nullptr) {
        func();
    }
}

// Bad: May crash
void unsafeCall(void (*func)()) {
    func();  // Crashes if func is nullptr
}
```

### 3. Use Function Pointers for Flexibility

```cpp
// Good: Flexible design
void processData(int* data, int size, int (*transform)(int)) {
    for (int i = 0; i < size; ++i) {
        data[i] = transform(data[i]);
    }
}

// Bad: Hardcoded behavior
void processData(int* data, int size) {
    for (int i = 0; i < size; ++i) {
        data[i] = data[i] * 2;  // Can't change behavior
    }
}
```

### 4. Prefer std::function for Modern C++

```cpp
#include <functional>
using namespace std;

// Good: More flexible (can use lambdas, function objects)
void modernCallback(function<void()> callback) {
    callback();
}

// Limited: Only function pointers
void oldCallback(void (*callback)()) {
    callback();
}

void example() {
    // Works with both
    modernCallback([]() { cout << "Lambda" << endl; });
    
    // Only works with function pointer
    void func() { cout << "Function" << endl; }
    oldCallback(func);
}
```

### 5. Document Function Pointer Signatures

```cpp
// Good: Clear documentation
/**
 * @param callback Function that takes int and returns bool
 *                 Returns true if element should be kept
 */
void filter(vector<int>& data, bool (*callback)(int)) {
    // ...
}

// Bad: Unclear what callback should do
void filter(vector<int>& data, bool (*callback)(int)) {
    // ...
}
```

---

## Common Pitfalls and Mistakes

### Pitfall 1: Calling Null Function Pointer

```cpp
// Bad: Crashes if pointer is null
void badExample() {
    void (*func)() = nullptr;
    func();  // Undefined behavior, likely crash
}

// Good: Always check
void goodExample() {
    void (*func)() = nullptr;
    if (func != nullptr) {
        func();
    }
}
```

### Pitfall 2: Wrong Function Signature

```cpp
// Bad: Signature mismatch
int add(int a, int b) { return a + b; }
void badExample() {
    int (*func)(int) = add;  // Error: signature doesn't match
}

// Good: Match signatures exactly
void goodExample() {
    int (*func)(int, int) = add;  // Correct
}
```

### Pitfall 3: Returning Pointer to Local Function

```cpp
// Bad: Returns pointer to local function (actually OK, but confusing)
int* badExample() {
    int local = 42;
    return &local;  // Dangling pointer!
}

// For function pointers, this is actually OK:
int (*goodExample())(int, int) {
    int add(int a, int b) { return a + b; }  // Not allowed in C++
    return add;  // Function pointers are OK
}

// Better: Return static or global function
int add(int a, int b) { return a + b; }
int (*betterExample())(int, int) {
    return add;  // OK: add is at global scope
}
```

### Pitfall 4: Confusing Syntax

```cpp
// Common confusion: function pointer vs function returning pointer

// Function pointer
int (*funcPtr)(int, int);

// Function returning pointer to int
int* funcReturningPtr(int, int);

// Function returning function pointer
int (*funcReturningFuncPtr())(int, int);

// Use typedef/using to avoid confusion
using FuncPtr = int (*)(int, int);
FuncPtr funcReturningFuncPtr2();
```

### Pitfall 5: Member Function Pointer Syntax

```cpp
class MyClass {
public:
    void method() {}
};

void memberPointerMistake() {
    MyClass obj;
    
    // Bad: Wrong syntax
    // void (*ptr)() = &MyClass::method;  // Error
    
    // Good: Correct member function pointer syntax
    void (MyClass::*ptr)() = &MyClass::method;
    (obj.*ptr)();
    
    // Or with pointer to object
    MyClass* objPtr = &obj;
    (objPtr->*ptr)();
}
```

### Pitfall 6: Function Pointer vs Function Object

```cpp
#include <functional>
using namespace std;

// Function pointer: only works with functions
void process1(int (*func)(int)) {
    func(42);
}

// std::function: works with functions, lambdas, function objects
void process2(function<int(int)> func) {
    func(42);
}

int square(int x) { return x * x; }

void comparisonExample() {
    // Both work with function
    process1(square);
    process2(square);
    
    // Only process2 works with lambda
    // process1([](int x) { return x * x; });  // Error
    process2([](int x) { return x * x; });     // OK
}
```

### Pitfall 7: Forgetting Parentheses

```cpp
int add(int a, int b) { return a + b; }

void parenthesesMistake() {
    // Bad: Missing parentheses (compiler error)
    // int *func(int, int) = add;  // This declares a function!
    
    // Good: Correct syntax
    int (*func)(int, int) = add;
}
```

### Pitfall 8: Type Mismatch in Arrays

```cpp
int add(int a, int b) { return a + b; }
double addDouble(double a, double b) { return a + b; }

void arrayMistake() {
    // Bad: Type mismatch
    // int (*ops[])(int, int) = {add, addDouble};  // Error
    
    // Good: All functions must have same signature
    int (*ops[])(int, int) = {add, add};  // OK
}
```

### Pitfall 9: Calling Through Wrong Object

```cpp
class Base {
public:
    virtual void method() { cout << "Base" << endl; }
};

class Derived : public Base {
public:
    void method() override { cout << "Derived" << endl; }
};

void wrongObjectMistake() {
    Derived derived;
    Base base;
    
    void (Base::*ptr)() = &Base::method;
    
    // Calls Base::method, not Derived::method
    (base.*ptr)();      // Prints "Base"
    (derived.*ptr)();   // Also prints "Base" (not polymorphic)
    
    // For polymorphism, use virtual functions, not function pointers
}
```

### Pitfall 10: Not Using make_function or std::function

```cpp
#include <functional>
using namespace std;

// Bad: Limited to function pointers only
void oldStyle(void (*callback)()) {
    callback();
}

// Good: Flexible, works with lambdas, function objects, etc.
void modernStyle(function<void()> callback) {
    callback();
}

void flexibilityExample() {
    // Both work
    void func() {}
    oldStyle(func);
    modernStyle(func);
    
    // Only modernStyle works
    modernStyle([]() { cout << "Lambda" << endl; });
    // oldStyle([]() { ... });  // Error
}
```

---

## Summary

Function pointers provide a way to:

- **Pass functions as arguments**: Enable callbacks and flexible designs
- **Store functions in data structures**: Function tables, lookup tables
- **Dynamic function dispatch**: Choose function at runtime
- **Implement patterns**: Strategy, observer, plugin systems

Key takeaways:

1. **Syntax matters**: `return_type (*name)(params)` for function pointers
2. **Use typedef/using**: Makes code more readable
3. **Always check for null**: Prevent crashes from null pointers
4. **Match signatures exactly**: Type safety is important
5. **Consider std::function**: More flexible for modern C++
6. **Member function pointers**: Use `(object.*ptr)()` syntax
7. **Document signatures**: Help others understand your code
8. **Avoid common pitfalls**: Null checks, syntax errors, type mismatches

Function pointers are a powerful feature, but modern C++ offers `std::function` and lambdas that are often more flexible and easier to use. Choose the right tool for your specific use case.

