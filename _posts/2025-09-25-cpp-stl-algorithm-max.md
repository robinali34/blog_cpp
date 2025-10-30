---
layout: post
title: "C++ STL: algorithm - max"
categories: programming cpp tutorial reference algorithm stl max comparator utility competitive-programming
---

# C++ STL: algorithm - max

In C++, `std::max` (from `<algorithm>` or `<utility>`) returns the greater of two values.

## Basic Example of std::max

```cpp
#include <iostream>
#include <algorithm>
using namespace std;

int main() {
  int a = 10;
  int b = 20;
  int maximum = max(a, b);
  cout << "Maximum is: " << maximum << endl; // Output: 20
  return 0;
}
```

## With Different Data Types

```cpp
double x = 5.5, y = 3.2;
cout << max(x, y) << endl; // Output: 5.5
```

## Using std::max with initializer_list (C++11+)

```cpp
#include <iostream>
#include <algorithm>
#include <initializer_list>
using namespace std;

int main() {
  int result = max({3, 7, 2, 9, 5});
  cout << "Max is: " << result << endl; // Output: 9
  return 0;
}
```

## Custom Comparator with Structs

```cpp
#include <iostream>
#include <algorithm>
#include <string>
using namespace std;

struct Person {
  string name;
  int age;
};

int main() {
  Person p1{"Alice", 30};
  Person p2{"Bob", 25};
  Person older = max(p1, p2, [](const Person& a, const Person& b) {
    return a.age < b.age; // comparator: returns true if a < b
  });
  cout << "Older person: " << older.name << endl; // Output: Alice
  return 0;
}
```

## max_element to get max in containers/structs

```cpp
#include <iostream>
#include <algorithm>
#include <vector>
#include <string>
using namespace std;

struct Person {
  string name;
  int age;
};

int main() {
  vector<Person> people = {
    {"Alice", 30},
    {"Bob", 45},
    {"Charlie", 28},
    {"Doana", 52},
    {"Eve", 39}
  };

  auto it = max_element(people.begin(), people.end(), [](const Person& a, const Person& b) {
    return a.age < b.age; // a < b comparator
  });

  if (it != people.end()) {
    cout << "Oldest person: " << it->name << " (Age: " << it->age << ")\n";
  } else {
    cout << "List is empty." << endl;
  }
}
```

## Notes

- `std::max` with two arguments uses `operator<` by default; provide a comparator for custom types.
- For more than two values, use the initializer_list overload or combine with `std::max_element`.
- Beware of mixed integral types (e.g., `int` vs `unsigned`) leading to promotions; prefer explicit casts.

## Reference

- cppreference: [`<algorithm>`](https://en.cppreference.com/w/cpp/header/algorithm)



