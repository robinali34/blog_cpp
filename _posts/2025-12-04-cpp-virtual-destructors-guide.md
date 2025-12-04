---
layout: post
title: "C++ Virtual Destructors: Complete Guide with Examples"
date: 2025-12-04 00:00:00 -0800
categories: cpp programming tutorial oop memory-management polymorphism
tags: cpp virtual-destructor destructor memory-leak polymorphism inheritance
excerpt: "A comprehensive guide to C++ virtual destructors covering why they're needed, memory leak prevention, proper cleanup, and best practices with practical examples."
---

# C++ Virtual Destructors: Complete Guide with Examples

Virtual destructors are crucial for proper resource cleanup when using polymorphism in C++. This guide explains why virtual destructors are essential and how to use them correctly.

## Why Virtual Destructors Are Needed

When you delete an object through a base class pointer, if the destructor is not virtual, only the base class destructor is called. This leads to **undefined behavior** and **memory leaks** if the derived class has resources to clean up.

### Problem: Without Virtual Destructor

```cpp
#include <iostream>

class Base {
public:
    ~Base() {  // ❌ Not virtual
        std::cout << "Base destructor called" << std::endl;
    }
};

class Derived : public Base {
private:
    int* data;
    
public:
    Derived() : data(new int[1000]) {
        std::cout << "Derived constructor: allocated memory" << std::endl;
    }
    
    ~Derived() {  // ❌ Never called when deleting through Base*
        delete[] data;
        std::cout << "Derived destructor called: freed memory" << std::endl;
    }
};

int main() {
    Base* ptr = new Derived();
    delete ptr;  // ❌ Only Base destructor called! Memory leak!
    
    // Output:
    // Derived constructor: allocated memory
    // Base destructor called
    // ❌ Derived destructor never called - MEMORY LEAK!
    
    return 0;
}
```

### Solution: With Virtual Destructor

```cpp
#include <iostream>

class Base {
public:
    virtual ~Base() {  // ✅ Virtual destructor
        std::cout << "Base destructor called" << std::endl;
    }
};

class Derived : public Base {
private:
    int* data;
    
public:
    Derived() : data(new int[1000]) {
        std::cout << "Derived constructor: allocated memory" << std::endl;
    }
    
    ~Derived() override {
        delete[] data;
        std::cout << "Derived destructor called: freed memory" << std::endl;
    }
};

int main() {
    Base* ptr = new Derived();
    delete ptr;  // ✅ Both destructors called correctly
    
    // Output:
    // Derived constructor: allocated memory
    // Derived destructor called: freed memory
    // Base destructor called
    // ✅ Proper cleanup!
    
    return 0;
}
```

---

## How Virtual Destructors Work

Virtual destructors work through the same vtable mechanism as other virtual functions:

1. When a class has a virtual destructor, it's stored in the vtable
2. When `delete` is called on a base pointer, the vtable is consulted
3. The correct destructor (most derived class first) is called
4. Destructors are called in reverse order of construction

### Destructor Call Order

```cpp
class Base {
public:
    Base() { std::cout << "Base constructor" << std::endl; }
    virtual ~Base() { std::cout << "Base destructor" << std::endl; }
};

class Derived : public Base {
public:
    Derived() { std::cout << "Derived constructor" << std::endl; }
    ~Derived() override { std::cout << "Derived destructor" << std::endl; }
};

class FurtherDerived : public Derived {
public:
    FurtherDerived() { std::cout << "FurtherDerived constructor" << std::endl; }
    ~FurtherDerived() override { std::cout << "FurtherDerived destructor" << std::endl; }
};

int main() {
    Base* ptr = new FurtherDerived();
    delete ptr;
    
    // Output:
    // Base constructor
    // Derived constructor
    // FurtherDerived constructor
    // FurtherDerived destructor  (most derived first)
    // Derived destructor
    // Base destructor            (base last)
    
    return 0;
}
```

---

## When Virtual Destructors Are Required

### Rule of Thumb

**If a class has any virtual functions, it should have a virtual destructor.**

This ensures proper cleanup when objects are deleted through base class pointers.

### Example: Polymorphic Base Class

```cpp
class Shape {
public:
    virtual double area() const = 0;
    virtual void draw() const = 0;
    
    virtual ~Shape() = default;  // ✅ Virtual destructor
};

class Circle : public Shape {
private:
    double radius;
    int* cache;  // Some resource
    
public:
    Circle(double r) : radius(r), cache(new int[100]) { }
    
    ~Circle() override {
        delete[] cache;  // ✅ Properly cleaned up
    }
    
    double area() const override {
        return 3.14159 * radius * radius;
    }
    
    void draw() const override {
        std::cout << "Drawing circle" << std::endl;
    }
};

int main() {
    Shape* shape = new Circle(5.0);
    delete shape;  // ✅ Circle destructor called, cache freed
    
    return 0;
}
```

---

## Virtual Destructor Syntax

### Basic Syntax

```cpp
class Base {
public:
    virtual ~Base() { }  // Virtual destructor
};

class Derived : public Base {
public:
    ~Derived() override { }  // Override (optional but recommended)
};
```

### Default Virtual Destructor (C++11)

```cpp
class Base {
public:
    virtual ~Base() = default;  // Default virtual destructor
};
```

### Pure Virtual Destructor

A destructor can be pure virtual, but it **must** have a definition (unlike other pure virtual functions).

```cpp
class AbstractBase {
public:
    virtual ~AbstractBase() = 0;  // Pure virtual destructor
};

// Must provide definition
AbstractBase::~AbstractBase() { }  // Definition required

class Derived : public AbstractBase {
public:
    ~Derived() override { }
};
```

---

## Practical Examples

### Example 1: Resource Management

```cpp
#include <iostream>
#include <fstream>

class FileHandler {
public:
    virtual void process() = 0;
    virtual ~FileHandler() = default;  // ✅ Virtual destructor
};

class TextFileHandler : public FileHandler {
private:
    std::ifstream file;
    
public:
    TextFileHandler(const std::string& filename) : file(filename) {
        if (!file.is_open()) {
            throw std::runtime_error("Cannot open file");
        }
    }
    
    ~TextFileHandler() override {
        if (file.is_open()) {
            file.close();  // ✅ Properly closed
            std::cout << "File closed" << std::endl;
        }
    }
    
    void process() override {
        std::string line;
        while (std::getline(file, line)) {
            std::cout << line << std::endl;
        }
    }
};

int main() {
    try {
        FileHandler* handler = new TextFileHandler("data.txt");
        handler->process();
        delete handler;  // ✅ File properly closed
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }
    
    return 0;
}
```

### Example 2: Smart Pointers and Virtual Destructors

```cpp
#include <memory>
#include <iostream>

class Base {
public:
    virtual void func() = 0;
    virtual ~Base() = default;  // ✅ Virtual destructor
};

class Derived : public Base {
private:
    int* data;
    
public:
    Derived() : data(new int[100]) { }
    
    ~Derived() override {
        delete[] data;
        std::cout << "Derived resources freed" << std::endl;
    }
    
    void func() override {
        std::cout << "Derived::func()" << std::endl;
    }
};

int main() {
    // With smart pointers, virtual destructor still matters
    std::unique_ptr<Base> ptr = std::make_unique<Derived>();
    ptr->func();
    // ✅ Destructor called automatically when ptr goes out of scope
    
    return 0;
}
```

### Example 3: Container of Base Pointers

```cpp
#include <vector>
#include <memory>
#include <iostream>

class Animal {
public:
    virtual void makeSound() = 0;
    virtual ~Animal() = default;  // ✅ Virtual destructor
};

class Dog : public Animal {
private:
    std::string* name;
    
public:
    Dog(const std::string& n) : name(new std::string(n)) { }
    
    ~Dog() override {
        delete name;
        std::cout << "Dog " << *name << " destroyed" << std::endl;
    }
    
    void makeSound() override {
        std::cout << *name << " says: Woof!" << std::endl;
    }
};

class Cat : public Animal {
private:
    std::string* name;
    
public:
    Cat(const std::string& n) : name(new std::string(n)) { }
    
    ~Cat() override {
        delete name;
        std::cout << "Cat " << *name << " destroyed" << std::endl;
    }
    
    void makeSound() override {
        std::cout << *name << " says: Meow!" << std::endl;
    }
};

int main() {
    std::vector<std::unique_ptr<Animal>> animals;
    
    animals.push_back(std::make_unique<Dog>("Buddy"));
    animals.push_back(std::make_unique<Cat>("Whiskers"));
    animals.push_back(std::make_unique<Dog>("Max"));
    
    for (auto& animal : animals) {
        animal->makeSound();
    }
    
    // ✅ All destructors called properly when vector is destroyed
    // Output:
    // Buddy says: Woof!
    // Whiskers says: Meow!
    // Max says: Woof!
    // Dog Max destroyed
    // Cat Whiskers destroyed
    // Dog Buddy destroyed
    
    return 0;
}
```

---

## Common Mistakes

### Mistake 1: Forgetting Virtual Destructor

```cpp
class Base {
public:
    virtual void func() { }
    // ❌ Missing virtual destructor
    ~Base() { }
};

class Derived : public Base {
private:
    int* data;
public:
    Derived() : data(new int[100]) { }
    ~Derived() { delete[] data; }  // ❌ May not be called
};
```

**Solution**: Always add virtual destructor when class has virtual functions.

### Mistake 2: Non-Virtual Destructor in Base Class

```cpp
class Base {
public:
    void func() { }  // Not virtual
    ~Base() { }      // ❌ Should be virtual if polymorphism is used
};

class Derived : public Base {
    // Resources that need cleanup
};
```

**Solution**: If you delete through base pointer, make destructor virtual.

### Mistake 3: Assuming Destructor Will Be Called

```cpp
Base* ptr = new Derived();
// ... use ptr ...
// ❌ Forgot to delete - destructor never called!
```

**Solution**: Use smart pointers or ensure proper cleanup.

---

## Best Practices

1. **Always use virtual destructors** in base classes that have virtual functions
2. **Use virtual destructors** even if base class has no virtual functions but polymorphism is used
3. **Use `= default`** for default virtual destructors (C++11+)
4. **Use smart pointers** (`std::unique_ptr`, `std::shared_ptr`) to avoid manual memory management
5. **Document virtual destructors** in base class documentation
6. **Follow RAII principles** for resource management
7. **Test destructor behavior** when using polymorphism

---

## Performance Considerations

Virtual destructors have minimal overhead:

- **One vtable lookup** per destructor call
- **Same memory overhead** as any virtual function (vtable pointer)
- **Negligible performance impact** in most applications
- **Critical for correctness** - the small overhead is worth it

---

## Summary

Virtual destructors are essential for proper resource cleanup:

- **Always use virtual destructors** in polymorphic base classes
- **Prevent memory leaks** by ensuring derived destructors are called
- **Follow RAII principles** for automatic resource management
- **Use smart pointers** to simplify memory management
- **Understand destructor call order** (most derived to base)
- **Test cleanup behavior** to ensure correctness

Remember: **If a class has virtual functions, it should have a virtual destructor.**

