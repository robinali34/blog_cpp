---
layout: post
title: "C++ STL: Lambda Capture Basics"
categories: programming cpp tutorial reference algorithm stl functional-programming lambda capture reference value competitive-programming
---

# C++ STL: Lambda Capture Basics

In C++, lambdas can capture variables from their surrounding scope in two main ways: by value or by reference. This guide summarizes the common capture syntaxes with simple examples.

## Capture Syntax and Meaning

- **[]**: Capture nothing
- **[&]**: Capture all local variables by reference
- **[=]**: Capture all local variables by value
- **[x]**: Capture variable `x` by value
- **[&x]**: Capture variable `x` by reference

## Examples

### [] (Capture Nothing)

```cpp
#include <iostream>
using namespace std;

int main() {
  auto add = [](int a, int b) {
    return a + b;
  };
  cout << "Sum: " << add(2, 3) << endl; // Output: 5
  return 0;
}
```

### [&] (Capture by Reference)

```cpp
#include <iostream>
using namespace std;

int main() {
  int x = 5;
  auto lambda = [&](int a) {
    return a + x; // uses x by reference
  };
  cout << "Add by x: " << lambda(3) << endl; // Output: 8
  return 0;
}
```

Modifying an external variable via reference capture:

```cpp
#include <iostream>
using namespace std;

int main() {
  int counter = 0;
  auto increment = [&]() {
    counter++; // Modify the external variable
  };
  increment();
  increment();
  cout << "Counter: " << counter << endl; // Counter: 2
  return 0;
}
```

### [=] (Capture by Value)

```cpp
#include <iostream>
using namespace std;

int main() {
  int x = 5;
  auto lambda = [=](int a) {
    return a + x; // x is captured by value (copied)
  };
  cout << "Add by x: " << lambda(3) << endl; // Output: 8
  return 0;
}
```

### [x] (Capture One Variable by Value)

```cpp
#include <iostream>
using namespace std;

int main() {
  int x = 42;
  int y = 5;
  auto show = [x]() {
    cout << "x = " << x << endl;
    // cout << "y = " << y << endl; // error: y not captured
  };
  show();
  return 0;
}
```

### [&x] (Capture One Variable by Reference)

```cpp
#include <iostream>
using namespace std;

int main() {
  int x = 1;
  auto multiply = [&x]() {
    x *= 5; // Modify x by reference
  };
  multiply();
  cout << "x = " << x << endl; // x = 5
  return 0;
}
```

## Summary Table

| Capture | Syntax | Meaning | Modifiable? |
|---|---|---|---|
| None | [] | Capture nothing | N/A |
| Value | [=] | Capture all local vars by value (copy) | ❌ (unless `mutable`) |
| Ref | [&] | Capture all local vars by reference | ✅ |
| Value x | [x] | Capture only `x` by value | ❌ (unless `mutable`) |
| Ref x | [&x] | Capture only `x` by reference | ✅ |

## Notes

- Use `mutable` to allow modification of value-captured variables inside the lambda body (modifies the copy, not the original).
- Prefer explicit captures (`[x, &y]`) for clarity and safety in larger scopes.
- Be careful with dangling references when capturing by reference if the lambda outlives the referenced variables.


