---
layout: post
title: "C++ Pure Virtual Functions: Complete Guide with Examples"
date: 2025-12-04 00:00:00 -0800
categories: cpp programming tutorial oop polymorphism abstract-classes
tags: cpp pure-virtual-functions abstract-class interface polymorphism inheritance
excerpt: "A comprehensive guide to C++ pure virtual functions covering abstract classes, interfaces, implementation requirements, and best practices with practical examples."
---

# C++ Pure Virtual Functions: Complete Guide with Examples

Pure virtual functions create abstract classes in C++, defining interfaces that derived classes must implement. This guide covers all aspects of pure virtual functions with practical examples.

## What are Pure Virtual Functions?

A **pure virtual function** is a virtual function declared in a base class with no implementation (using `= 0`). Classes containing pure virtual functions are **abstract classes** and cannot be instantiated directly.

### Basic Syntax

```cpp
class AbstractBase {
public:
    // Pure virtual function
    virtual void pureFunc() = 0;
    
    // Regular virtual function (has implementation)
    virtual void regularFunc() {
        std::cout << "Default implementation" << std::endl;
    }
    
    virtual ~AbstractBase() = default;
};
```

### Basic Example

```cpp
#include <iostream>

class Shape {
public:
    // Pure virtual function - must be implemented by derived classes
    virtual double area() const = 0;
    
    // Pure virtual function
    virtual void draw() const = 0;
    
    // Regular virtual function with default implementation
    virtual void printInfo() const {
        std::cout << "Shape information" << std::endl;
    }
    
    virtual ~Shape() = default;
};

class Circle : public Shape {
private:
    double radius;
    
public:
    Circle(double r) : radius(r) { }
    
    // Must implement pure virtual functions
    double area() const override {
        return 3.14159 * radius * radius;
    }
    
    void draw() const override {
        std::cout << "Drawing circle with radius " << radius << std::endl;
    }
};

int main() {
    // Shape shape;  // ❌ Error: cannot instantiate abstract class
    
    Circle circle(5.0);
    circle.draw();           // ✅ Works
    std::cout << "Area: " << circle.area() << std::endl;
    
    Shape* shapePtr = &circle;  // ✅ Can use pointer/reference
    shapePtr->draw();
    
    return 0;
}
```

---

## Abstract Classes

A class with at least one pure virtual function is an **abstract class**:

- **Cannot be instantiated** directly
- **Can be used** as pointers or references
- **Derived classes must implement** all pure virtual functions to be concrete

### Example: Abstract Animal Class

```cpp
#include <iostream>
#include <string>

class Animal {
public:
    // Pure virtual functions - must be implemented
    virtual void makeSound() const = 0;
    virtual void move() const = 0;
    virtual std::string getName() const = 0;
    
    // Regular virtual function with default
    virtual void sleep() const {
        std::cout << getName() << " is sleeping" << std::endl;
    }
    
    virtual ~Animal() = default;
};

class Dog : public Animal {
private:
    std::string name;
    
public:
    Dog(const std::string& n) : name(n) { }
    
    // Implement all pure virtual functions
    void makeSound() const override {
        std::cout << name << " says: Woof! Woof!" << std::endl;
    }
    
    void move() const override {
        std::cout << name << " runs on four legs" << std::endl;
    }
    
    std::string getName() const override {
        return name;
    }
};

class Bird : public Animal {
private:
    std::string name;
    
public:
    Bird(const std::string& n) : name(n) { }
    
    void makeSound() const override {
        std::cout << name << " says: Chirp! Chirp!" << std::endl;
    }
    
    void move() const override {
        std::cout << name << " flies" << std::endl;
    }
    
    std::string getName() const override {
        return name;
    }
};

int main() {
    // Animal animal;  // ❌ Error: abstract class cannot be instantiated
    
    Dog dog("Buddy");
    Bird bird("Tweety");
    
    Animal* animals[] = {&dog, &bird};
    
    for (Animal* animal : animals) {
        animal->makeSound();
        animal->move();
        animal->sleep();  // Uses default implementation
    }
    
    return 0;
}
```

---

## Interfaces in C++

C++ doesn't have a separate `interface` keyword like Java or C#, but you can create **interface-like classes** using pure virtual functions:

### Interface Pattern

```cpp
// Interface: all functions are pure virtual
class IReadable {
public:
    virtual std::string read() const = 0;
    virtual ~IReadable() = default;
};

class IWritable {
public:
    virtual void write(const std::string& data) = 0;
    virtual ~IWritable() = default;
};

// Class implementing multiple interfaces
class File : public IReadable, public IWritable {
private:
    std::string filename;
    
public:
    File(const std::string& name) : filename(name) { }
    
    std::string read() const override {
        return "Reading from " + filename;
    }
    
    void write(const std::string& data) override {
        std::cout << "Writing to " << filename << ": " << data << std::endl;
    }
};

int main() {
    File file("data.txt");
    
    IReadable* readable = &file;
    IWritable* writable = &file;
    
    std::cout << readable->read() << std::endl;
    writable->write("Hello, World!");
    
    return 0;
}
```

---

## Pure Virtual Functions with Implementation

In C++, you can provide an implementation for a pure virtual function, but the class remains abstract:

```cpp
class Base {
public:
    // Pure virtual with implementation
    virtual void func() = 0;
};

// Implementation can be provided
void Base::func() {
    std::cout << "Base::func() implementation" << std::endl;
}

class Derived : public Base {
public:
    void func() override {
        Base::func();  // Can call base implementation
        std::cout << "Derived::func() additional work" << std::endl;
    }
};

int main() {
    // Base base;  // ❌ Still abstract, cannot instantiate
    
    Derived derived;
    derived.func();
    
    return 0;
}
```

---

## Pure Virtual Destructor

A destructor can be pure virtual, but it **must** have a definition:

```cpp
class AbstractBase {
public:
    virtual ~AbstractBase() = 0;  // Pure virtual destructor
};

// Must provide definition (unlike other pure virtual functions)
AbstractBase::~AbstractBase() {
    std::cout << "AbstractBase destructor" << std::endl;
}

class Derived : public AbstractBase {
public:
    ~Derived() override {
        std::cout << "Derived destructor" << std::endl;
    }
};

int main() {
    AbstractBase* ptr = new Derived();
    delete ptr;  // ✅ Both destructors called
    
    return 0;
}
```

---

## Practical Examples

### Example 1: Graphics System

```cpp
#include <iostream>
#include <vector>
#include <cmath>

class Drawable {
public:
    virtual void draw() const = 0;
    virtual double getArea() const = 0;
    virtual ~Drawable() = default;
};

class Circle : public Drawable {
private:
    double x, y, radius;
    
public:
    Circle(double x, double y, double r) : x(x), y(y), radius(r) { }
    
    void draw() const override {
        std::cout << "Drawing circle at (" << x << ", " << y 
                  << ") with radius " << radius << std::endl;
    }
    
    double getArea() const override {
        return 3.14159 * radius * radius;
    }
};

class Rectangle : public Drawable {
private:
    double x, y, width, height;
    
public:
    Rectangle(double x, double y, double w, double h) 
        : x(x), y(y), width(w), height(h) { }
    
    void draw() const override {
        std::cout << "Drawing rectangle at (" << x << ", " << y 
                  << ") with size " << width << "x" << height << std::endl;
    }
    
    double getArea() const override {
        return width * height;
    }
};

int main() {
    std::vector<Drawable*> shapes;
    
    shapes.push_back(new Circle(0, 0, 5));
    shapes.push_back(new Rectangle(10, 10, 4, 6));
    shapes.push_back(new Circle(20, 20, 3));
    
    for (Drawable* shape : shapes) {
        shape->draw();
        std::cout << "Area: " << shape->getArea() << std::endl;
    }
    
    // Cleanup
    for (Drawable* shape : shapes) {
        delete shape;
    }
    
    return 0;
}
```

### Example 2: Plugin System

```cpp
#include <iostream>
#include <string>
#include <vector>

class Plugin {
public:
    virtual void initialize() = 0;
    virtual void execute() = 0;
    virtual void cleanup() = 0;
    virtual std::string getName() const = 0;
    virtual ~Plugin() = default;
};

class CalculatorPlugin : public Plugin {
public:
    void initialize() override {
        std::cout << "Calculator plugin initialized" << std::endl;
    }
    
    void execute() override {
        std::cout << "Calculator: 2 + 2 = 4" << std::endl;
    }
    
    void cleanup() override {
        std::cout << "Calculator plugin cleaned up" << std::endl;
    }
    
    std::string getName() const override {
        return "Calculator";
    }
};

class LoggerPlugin : public Plugin {
public:
    void initialize() override {
        std::cout << "Logger plugin initialized" << std::endl;
    }
    
    void execute() override {
        std::cout << "Logger: Logging message" << std::endl;
    }
    
    void cleanup() override {
        std::cout << "Logger plugin cleaned up" << std::endl;
    }
    
    std::string getName() const override {
        return "Logger";
    }
};

class PluginManager {
private:
    std::vector<Plugin*> plugins;
    
public:
    void registerPlugin(Plugin* plugin) {
        plugins.push_back(plugin);
    }
    
    void initializeAll() {
        for (Plugin* plugin : plugins) {
            plugin->initialize();
        }
    }
    
    void executeAll() {
        for (Plugin* plugin : plugins) {
            std::cout << "Executing " << plugin->getName() << ":" << std::endl;
            plugin->execute();
        }
    }
    
    void cleanupAll() {
        for (Plugin* plugin : plugins) {
            plugin->cleanup();
        }
    }
    
    ~PluginManager() {
        for (Plugin* plugin : plugins) {
            delete plugin;
        }
    }
};

int main() {
    PluginManager manager;
    
    manager.registerPlugin(new CalculatorPlugin());
    manager.registerPlugin(new LoggerPlugin());
    
    manager.initializeAll();
    manager.executeAll();
    manager.cleanupAll();
    
    return 0;
}
```

### Example 3: Strategy Pattern

```cpp
#include <iostream>
#include <vector>

class SortingStrategy {
public:
    virtual void sort(std::vector<int>& data) = 0;
    virtual ~SortingStrategy() = default;
};

class BubbleSort : public SortingStrategy {
public:
    void sort(std::vector<int>& data) override {
        std::cout << "Using Bubble Sort" << std::endl;
        // Bubble sort implementation
        for (size_t i = 0; i < data.size(); ++i) {
            for (size_t j = 0; j < data.size() - i - 1; ++j) {
                if (data[j] > data[j + 1]) {
                    std::swap(data[j], data[j + 1]);
                }
            }
        }
    }
};

class QuickSort : public SortingStrategy {
public:
    void sort(std::vector<int>& data) override {
        std::cout << "Using Quick Sort" << std::endl;
        // Quick sort implementation (simplified)
        std::sort(data.begin(), data.end());
    }
};

class Sorter {
private:
    SortingStrategy* strategy;
    
public:
    Sorter(SortingStrategy* s) : strategy(s) { }
    
    void setStrategy(SortingStrategy* s) {
        strategy = s;
    }
    
    void performSort(std::vector<int>& data) {
        strategy->sort(data);
    }
};

int main() {
    std::vector<int> data = {64, 34, 25, 12, 22, 11, 90};
    
    BubbleSort bubbleSort;
    QuickSort quickSort;
    
    Sorter sorter(&bubbleSort);
    sorter.performSort(data);
    
    data = {64, 34, 25, 12, 22, 11, 90};
    sorter.setStrategy(&quickSort);
    sorter.performSort(data);
    
    return 0;
}
```

---

## Common Mistakes

### Mistake 1: Trying to Instantiate Abstract Class

```cpp
class Abstract {
public:
    virtual void func() = 0;
};

int main() {
    Abstract obj;  // ❌ Error: cannot instantiate abstract class
    return 0;
}
```

**Solution**: Only instantiate concrete derived classes.

### Mistake 2: Not Implementing All Pure Virtual Functions

```cpp
class Base {
public:
    virtual void func1() = 0;
    virtual void func2() = 0;
};

class Derived : public Base {
public:
    void func1() override { }  // ❌ Missing func2() - still abstract
};

int main() {
    Derived obj;  // ❌ Error: Derived is still abstract
    return 0;
}
```

**Solution**: Implement all pure virtual functions to make class concrete.

### Mistake 3: Forgetting Virtual Destructor

```cpp
class Base {
public:
    virtual void func() = 0;
    // ❌ Missing virtual destructor
    ~Base() { }
};
```

**Solution**: Always use virtual destructor in abstract base classes.

---

## Best Practices

1. **Use pure virtual functions** to define interfaces
2. **Always provide virtual destructor** in abstract classes
3. **Document pure virtual functions** that must be implemented
4. **Provide default implementations** for optional behavior using regular virtual functions
5. **Use pure virtual destructors** when you want abstract class but need destructor definition
6. **Implement all pure virtual functions** in derived classes to make them concrete
7. **Use interfaces** (all pure virtual) for maximum flexibility

---

## Summary

Pure virtual functions are essential for creating abstract classes and interfaces:

- **Pure virtual functions** (`= 0`) create abstract classes
- **Abstract classes** cannot be instantiated directly
- **Derived classes must implement** all pure virtual functions to be concrete
- **Use for interfaces** and defining contracts
- **Always use virtual destructors** in abstract classes
- **Follow best practices** for clean, maintainable code

Pure virtual functions enable powerful design patterns and clean architecture in C++.

