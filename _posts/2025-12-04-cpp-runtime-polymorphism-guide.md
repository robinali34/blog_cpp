---
layout: post
title: "C++ Runtime Polymorphism: Complete Guide with Examples"
date: 2025-12-04 00:00:00 -0800
categories: cpp programming tutorial oop polymorphism inheritance
tags: cpp runtime-polymorphism polymorphism virtual-functions late-binding vtable
excerpt: "A comprehensive guide to C++ runtime polymorphism covering virtual functions, vtable mechanism, late binding, and practical examples demonstrating polymorphic behavior."
---

# C++ Runtime Polymorphism: Complete Guide with Examples

Runtime polymorphism (also called late binding or dynamic binding) allows C++ to determine which function to call at runtime based on the actual object type, not the pointer or reference type. This guide covers all aspects of runtime polymorphism with practical examples.

## What is Runtime Polymorphism?

**Runtime polymorphism** enables a program to call the correct function based on the actual object type at runtime, even when accessed through a base class pointer or reference. This is achieved through virtual functions and vtables.

### Compile-Time vs Runtime Polymorphism

```cpp
#include <iostream>

class Base {
public:
    // Non-virtual: compile-time binding
    void compileTimeFunc() {
        std::cout << "Base::compileTimeFunc()" << std::endl;
    }
    
    // Virtual: runtime binding
    virtual void runtimeFunc() {
        std::cout << "Base::runtimeFunc()" << std::endl;
    }
};

class Derived : public Base {
public:
    void compileTimeFunc() {
        std::cout << "Derived::compileTimeFunc()" << std::endl;
    }
    
    void runtimeFunc() override {
        std::cout << "Derived::runtimeFunc()" << std::endl;
    }
};

int main() {
    Derived derived;
    Base* basePtr = &derived;
    
    // Compile-time binding: based on pointer type
    basePtr->compileTimeFunc();  // Output: Base::compileTimeFunc()
    
    // Runtime binding: based on actual object type
    basePtr->runtimeFunc();     // Output: Derived::runtimeFunc()
    
    return 0;
}
```

---

## How Runtime Polymorphism Works

Runtime polymorphism is implemented using **virtual function tables (vtables)**:

1. **VTable Creation**: Each class with virtual functions has a vtable
2. **VTable Pointer**: Each object contains a pointer to its class's vtable
3. **Function Lookup**: Virtual function calls go through the vtable
4. **Runtime Resolution**: The correct function is determined at runtime

### VTable Mechanism

```cpp
class Base {
public:
    virtual void func1() { }
    virtual void func2() { }
    int data;
};

class Derived : public Base {
public:
    void func1() override { }
    virtual void func3() { }
    int moreData;
};
```

**Memory Layout:**

```
Base object:
[VTable pointer] -> points to Base vtable
[data: int]

Base vtable:
[0] -> Base::func1()
[1] -> Base::func2()

Derived object:
[VTable pointer] -> points to Derived vtable
[data: int] (from Base)
[moreData: int]

Derived vtable:
[0] -> Derived::func1()  (overridden)
[1] -> Base::func2()     (inherited)
[2] -> Derived::func3()  (new)
```

---

## Virtual Functions and Runtime Polymorphism

Virtual functions are the mechanism that enables runtime polymorphism:

```cpp
#include <iostream>
#include <vector>

class Animal {
public:
    virtual void makeSound() {
        std::cout << "Some animal sound" << std::endl;
    }
    
    virtual void move() {
        std::cout << "Animal moves" << std::endl;
    }
    
    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    void makeSound() override {
        std::cout << "Woof! Woof!" << std::endl;
    }
    
    void move() override {
        std::cout << "Dog runs on four legs" << std::endl;
    }
};

class Cat : public Animal {
public:
    void makeSound() override {
        std::cout << "Meow! Meow!" << std::endl;
    }
    
    void move() override {
        std::cout << "Cat walks gracefully" << std::endl;
    }
};

class Bird : public Animal {
public:
    void makeSound() override {
        std::cout << "Chirp! Chirp!" << std::endl;
    }
    
    void move() override {
        std::cout << "Bird flies" << std::endl;
    }
};

int main() {
    std::vector<Animal*> animals;
    
    animals.push_back(new Dog());
    animals.push_back(new Cat());
    animals.push_back(new Bird());
    animals.push_back(new Dog());
    
    // Runtime polymorphism: correct function called for each object
    for (Animal* animal : animals) {
        animal->makeSound();  // Calls appropriate derived class function
        animal->move();
        std::cout << "---" << std::endl;
    }
    
    // Cleanup
    for (Animal* animal : animals) {
        delete animal;
    }
    
    return 0;
}
```

**Output:**
```
Woof! Woof!
Dog runs on four legs
---
Meow! Meow!
Cat walks gracefully
---
Chirp! Chirp!
Bird flies
---
Woof! Woof!
Dog runs on four legs
---
```

---

## Practical Examples

### Example 1: Shape Hierarchy

```cpp
#include <iostream>
#include <vector>
#include <cmath>
#include <memory>

class Shape {
public:
    virtual double area() const = 0;
    virtual double perimeter() const = 0;
    virtual void draw() const = 0;
    virtual std::string getName() const = 0;
    virtual ~Shape() = default;
};

class Circle : public Shape {
private:
    double radius;
    
public:
    Circle(double r) : radius(r) { }
    
    double area() const override {
        return 3.14159 * radius * radius;
    }
    
    double perimeter() const override {
        return 2 * 3.14159 * radius;
    }
    
    void draw() const override {
        std::cout << "Drawing circle (radius: " << radius << ")" << std::endl;
    }
    
    std::string getName() const override {
        return "Circle";
    }
};

class Rectangle : public Shape {
private:
    double width, height;
    
public:
    Rectangle(double w, double h) : width(w), height(h) { }
    
    double area() const override {
        return width * height;
    }
    
    double perimeter() const override {
        return 2 * (width + height);
    }
    
    void draw() const override {
        std::cout << "Drawing rectangle (" << width << "x" << height << ")" << std::endl;
    }
    
    std::string getName() const override {
        return "Rectangle";
    }
};

class Triangle : public Shape {
private:
    double a, b, c;
    
public:
    Triangle(double side1, double side2, double side3) 
        : a(side1), b(side2), c(side3) { }
    
    double area() const override {
        // Heron's formula
        double s = (a + b + c) / 2.0;
        return std::sqrt(s * (s - a) * (s - b) * (s - c));
    }
    
    double perimeter() const override {
        return a + b + c;
    }
    
    void draw() const override {
        std::cout << "Drawing triangle (sides: " << a << ", " << b << ", " << c << ")" << std::endl;
    }
    
    std::string getName() const override {
        return "Triangle";
    }
};

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    
    shapes.push_back(std::make_unique<Circle>(5.0));
    shapes.push_back(std::make_unique<Rectangle>(4.0, 6.0));
    shapes.push_back(std::make_unique<Triangle>(3.0, 4.0, 5.0));
    shapes.push_back(std::make_unique<Circle>(3.0));
    
    // Runtime polymorphism: each shape behaves according to its type
    for (const auto& shape : shapes) {
        std::cout << "Shape: " << shape->getName() << std::endl;
        shape->draw();
        std::cout << "Area: " << shape->area() << std::endl;
        std::cout << "Perimeter: " << shape->perimeter() << std::endl;
        std::cout << "---" << std::endl;
    }
    
    return 0;
}
```

### Example 2: Employee Management System

```cpp
#include <iostream>
#include <vector>
#include <string>
#include <memory>

class Employee {
protected:
    std::string name;
    double baseSalary;
    
public:
    Employee(const std::string& n, double salary) 
        : name(n), baseSalary(salary) { }
    
    virtual double calculateSalary() const {
        return baseSalary;
    }
    
    virtual void work() const = 0;
    
    virtual std::string getRole() const = 0;
    
    virtual ~Employee() = default;
    
    std::string getName() const {
        return name;
    }
};

class Developer : public Employee {
public:
    Developer(const std::string& n, double salary) 
        : Employee(n, salary) { }
    
    double calculateSalary() const override {
        return baseSalary * 1.2;  // 20% bonus
    }
    
    void work() const override {
        std::cout << name << " is writing code" << std::endl;
    }
    
    std::string getRole() const override {
        return "Developer";
    }
};

class Manager : public Employee {
private:
    int teamSize;
    
public:
    Manager(const std::string& n, double salary, int team) 
        : Employee(n, salary), teamSize(team) { }
    
    double calculateSalary() const override {
        return baseSalary * 1.5 + teamSize * 1000;  // Bonus + team bonus
    }
    
    void work() const override {
        std::cout << name << " is managing a team of " << teamSize << " people" << std::endl;
    }
    
    std::string getRole() const override {
        return "Manager";
    }
};

class Designer : public Employee {
public:
    Designer(const std::string& n, double salary) 
        : Employee(n, salary) { }
    
    double calculateSalary() const override {
        return baseSalary * 1.15;  // 15% bonus
    }
    
    void work() const override {
        std::cout << name << " is designing user interfaces" << std::endl;
    }
    
    std::string getRole() const override {
        return "Designer";
    }
};

int main() {
    std::vector<std::unique_ptr<Employee>> employees;
    
    employees.push_back(std::make_unique<Developer>("Alice", 80000));
    employees.push_back(std::make_unique<Manager>("Bob", 100000, 5));
    employees.push_back(std::make_unique<Designer>("Charlie", 70000));
    employees.push_back(std::make_unique<Developer>("David", 85000));
    
    // Runtime polymorphism: each employee's methods called correctly
    for (const auto& emp : employees) {
        std::cout << emp->getName() << " (" << emp->getRole() << ")" << std::endl;
        emp->work();
        std::cout << "Salary: $" << emp->calculateSalary() << std::endl;
        std::cout << "---" << std::endl;
    }
    
    return 0;
}
```

### Example 3: Payment Processing System

```cpp
#include <iostream>
#include <vector>
#include <string>
#include <memory>

class PaymentMethod {
public:
    virtual bool processPayment(double amount) = 0;
    virtual std::string getMethodName() const = 0;
    virtual ~PaymentMethod() = default;
};

class CreditCard : public PaymentMethod {
private:
    std::string cardNumber;
    
public:
    CreditCard(const std::string& card) : cardNumber(card) { }
    
    bool processPayment(double amount) override {
        std::cout << "Processing credit card payment of $" << amount 
                  << " with card ending in " << cardNumber.substr(cardNumber.length() - 4) 
                  << std::endl;
        return true;
    }
    
    std::string getMethodName() const override {
        return "Credit Card";
    }
};

class PayPal : public PaymentMethod {
private:
    std::string email;
    
public:
    PayPal(const std::string& e) : email(e) { }
    
    bool processPayment(double amount) override {
        std::cout << "Processing PayPal payment of $" << amount 
                  << " for " << email << std::endl;
        return true;
    }
    
    std::string getMethodName() const override {
        return "PayPal";
    }
};

class BankTransfer : public PaymentMethod {
private:
    std::string accountNumber;
    
public:
    BankTransfer(const std::string& account) : accountNumber(account) { }
    
    bool processPayment(double amount) override {
        std::cout << "Processing bank transfer of $" << amount 
                  << " to account " << accountNumber << std::endl;
        return true;
    }
    
    std::string getMethodName() const override {
        return "Bank Transfer";
    }
};

class PaymentProcessor {
public:
    static void processPayments(const std::vector<std::unique_ptr<PaymentMethod>>& methods, 
                                double amount) {
        for (const auto& method : methods) {
            std::cout << "Using " << method->getMethodName() << ":" << std::endl;
            method->processPayment(amount);
            std::cout << "---" << std::endl;
        }
    }
};

int main() {
    std::vector<std::unique_ptr<PaymentMethod>> paymentMethods;
    
    paymentMethods.push_back(std::make_unique<CreditCard>("1234567890123456"));
    paymentMethods.push_back(std::make_unique<PayPal>("user@example.com"));
    paymentMethods.push_back(std::make_unique<BankTransfer>("ACC123456789"));
    
    // Runtime polymorphism: each payment method processes correctly
    PaymentProcessor::processPayments(paymentMethods, 100.0);
    
    return 0;
}
```

---

## Runtime Polymorphism Requirements

For runtime polymorphism to work:

1. **Base class function must be virtual**
2. **Derived class function must override** (same signature)
3. **Access through pointer or reference** to base class
4. **Virtual destructor** in base class for proper cleanup

### Complete Example

```cpp
class Base {
public:
    virtual void func() { }      // ✅ Virtual
    virtual ~Base() { }          // ✅ Virtual destructor
};

class Derived : public Base {
public:
    void func() override { }     // ✅ Overrides
    ~Derived() override { }      // ✅ Destructor
};

int main() {
    Base* ptr = new Derived();   // ✅ Base pointer
    ptr->func();                 // ✅ Runtime polymorphism works
    delete ptr;                  // ✅ Proper cleanup
    
    return 0;
}
```

---

## Performance Considerations

Runtime polymorphism has some overhead:

- **VTable lookup**: One indirection per virtual function call
- **Memory overhead**: VTable pointer per object (typically 8 bytes)
- **Cache effects**: VTable lookups can cause cache misses
- **Inlining**: Virtual functions generally cannot be inlined

### When to Use Runtime Polymorphism

✅ **Use when:**
- You need different behavior for different derived types
- You're using base class pointers/references
- Flexibility and extensibility are important

❌ **Consider alternatives when:**
- Performance is critical
- Template-based polymorphism (CRTP) fits better
- Compile-time polymorphism is sufficient

---

## Best Practices

1. **Use virtual functions** for runtime polymorphism
2. **Always use virtual destructors** in polymorphic base classes
3. **Use `override` keyword** (C++11+) for clarity and safety
4. **Use smart pointers** for automatic memory management
5. **Document virtual functions** that are meant to be overridden
6. **Consider performance** when polymorphism is in hot paths
7. **Use pure virtual functions** for abstract interfaces

---

## Summary

Runtime polymorphism is a powerful feature of C++:

- **Enables late binding** through virtual functions and vtables
- **Allows flexible, extensible code** through base class interfaces
- **Requires virtual functions** and proper inheritance
- **Has performance overhead** but provides flexibility
- **Essential for object-oriented design** patterns
- **Use with virtual destructors** for proper cleanup

Understanding runtime polymorphism is crucial for effective C++ object-oriented programming.

