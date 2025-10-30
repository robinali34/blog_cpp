---
layout: post
title: "C Programming Cheat Sheet"
date: 2025-09-24 23:00:00 -0000
categories: programming c cheat-sheet reference tutorial data-structures syntax data-types pointers functions control-structures memory-management programming-fundamentals
---

# C Programming Cheat Sheet

A comprehensive reference guide for C programming language covering syntax, data types, control structures, functions, pointers, and more.

## Embedded C Cheatsheet for LeetCode Interviews

### ✅ 1. Language Basics

#### Data Types
```c
int       // 4 bytes
char      // 1 byte
float     // 4 bytes
double    // 8 bytes
long long // 8 bytes
```

#### Modifiers
```c
const int MAX = 1000;      // Read-only
volatile int sensor_val;   // Avoid compiler optimization
static int counter = 0;    // Persist between calls
```

#### Structs
```c
typedef struct {
    int x;
    int y;
} Point;
```

### ✅ 2. Memory & Arrays

#### Static Array Declaration
```c
#define MAX_SIZE 1000
int arr[MAX_SIZE];
```

#### 2D Arrays
```c
int grid[100][100];
```

#### Array Length
```c
int len = sizeof(arr) / sizeof(arr[0]);
```

### ✅ 3. Pointers
```c
int* p = &val;
*p = 10;

int arr[] = {1,2,3};
int* ptr = arr;
```

### ✅ 4. Strings
```c
char str[] = "hello";
strlen(str);
strcpy(dst, src);
strcmp(a, b);
```

### ✅ 5. Function Declarations
```c
int add(int a, int b);
void process(char* str);
```

### ✅ 6. Bit Manipulation
```c
x & 1       // Check if odd
x >> 1      // Divide by 2
x << 1      // Multiply by 2
x ^ y       // XOR
x & ~(1<<i) // Clear bit i
x | (1<<i)  // Set bit i
```

### ✅ 7. Common Algorithms

#### Reverse Array In-place
```c
void reverse(int* arr, int len) {
    int l = 0, r = len - 1;
    while (l < r) {
        int temp = arr[l];
        arr[l++] = arr[r];
        arr[r--] = temp;
    }
}
```

#### Swap
```c
void swap(int* a, int* b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}
```

### ✅ 8. Linked List
```c
typedef struct Node {
    int val;
    struct Node* next;
} Node;
```

#### Insert at Head
```c
Node* insert(Node* head, int val) {
    static Node nodes[1000];
    static int idx = 0;

    nodes[idx].val = val;
    nodes[idx].next = head;
    return &nodes[idx++];
}
```

### ✅ 9. Queue (Fixed Size)
```c
typedef struct {
    int data[1000];
    int front, rear, size;
} Queue;
```

#### Operations
```c
void enqueue(Queue* q, int val);
int dequeue(Queue* q);
int isEmpty(Queue* q);
```

### ✅ 10. Hash Map (Simple Fixed Size)
```c
#define MAP_SIZE 1024

typedef struct {
    int key;
    int val;
    int used; // 0 = empty, 1 = occupied
} Entry;

Entry map[MAP_SIZE];

int hash(int key) { return key % MAP_SIZE; }

void put(int key, int val) {
    int i = hash(key);
    while (map[i].used && map[i].key != key) i = (i + 1) % MAP_SIZE;
    map[i] = (Entry){ key, val, 1 };
}

int get(int key) {
    int i = hash(key);
    while (map[i].used) {
        if (map[i].key == key) return map[i].val;
        i = (i + 1) % MAP_SIZE;
    }
    return -1; // Not found
}
```

### ✅ 11. Grid Traversal (DFS/BFS)

#### 4-Neighbor DFS
```c
void dfs(int x, int y) {
    if (out_of_bounds(x, y) || visited[x][y]) return;
    visited[x][y] = 1;
    dfs(x+1, y); dfs(x-1, y); dfs(x, y+1); dfs(x, y-1);
}
```

### ✅ 12. Dynamic Programming (Static DP Table)
```c
int dp[1001][1001]; // Use memset to initialize
```

### ✅ 13. Sorting (Custom)
```c
int cmp(const void* a, const void* b) {
    return (*(int*)a - *(int*)b);
}
qsort(arr, n, sizeof(int), cmp);
```

### ✅ 14. Macros & Preprocessor
```c
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))
```

### ✅ 15. Common LeetCode-Compatible Headers
```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdbool.h>
```

### ✅ 16. Memory Constraints (No malloc)

In Embedded C/LeetCode-style questions:
- Avoid malloc
- Use static arrays and indexing
- Reuse memory across functions

## 🧠 Common Interview Patterns

| Pattern | Example Problem |
|---------|----------------|
| Sliding Window | Longest Substring Without Repeat |
| Two Pointers | Two Sum, Remove Duplicates |
| Hashing | Anagrams, Majority Element |
| Bitmasking | Subsets, Parity Checking |
| BFS / DFS | Island Count, Maze Solver |
| DP | Knapsack, Climbing Stairs |

### ✅ LeetCode-Compatible Stub Example
```c
int findMax(int* nums, int numsSize) {
    int max = nums[0];
    for (int i = 1; i < numsSize; i++) {
        if (nums[i] > max) max = nums[i];
    }
    return max;
}
```

### 📘 Print Debugging
```c
printf("val = %d\n", val);
```

### ✅ Resources for Practice
- LeetCode "C" tag
- STM32 or ARM embedded simulators
- Online Judge (UVa, AtCoder)

## 🚀 30-Minute LeetCode OA Interview Guide

### ⏰ Time Management Strategy
- **5 minutes**: Read problem, understand constraints, plan approach
- **20 minutes**: Implement solution
- **5 minutes**: Test edge cases, debug, optimize

### 📋 Common OA Problem Types (30-min format)

#### 1. Array Manipulation (Easy-Medium)
**Example: Two Sum**
```c
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    static int result[2];
    *returnSize = 2;
    
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                result[0] = i;
                result[1] = j;
                return result;
            }
        }
    }
    return NULL;
}
```

#### 2. String Processing (Easy-Medium)
**Example: Valid Parentheses**
```c
bool isValid(char* s) {
    char stack[10000];
    int top = -1;
    
    for (int i = 0; s[i]; i++) {
        if (s[i] == '(' || s[i] == '[' || s[i] == '{') {
            stack[++top] = s[i];
        } else {
            if (top == -1) return false;
            char open = stack[top--];
            if ((s[i] == ')' && open != '(') ||
                (s[i] == ']' && open != '[') ||
                (s[i] == '}' && open != '{')) {
                return false;
            }
        }
    }
    return top == -1;
}
```

#### 3. Binary Search (Medium)
**Example: Search Insert Position**
```c
int searchInsert(int* nums, int numsSize, int target) {
    int left = 0, right = numsSize - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return left;
}
```

#### 4. Sliding Window (Medium)
**Example: Longest Substring Without Repeating Characters**
```c
int lengthOfLongestSubstring(char* s) {
    int charMap[128] = {0};
    int left = 0, maxLen = 0;
    
    for (int right = 0; s[right]; right++) {
        charMap[s[right]]++;
        
        while (charMap[s[right]] > 1) {
            charMap[s[left]]--;
            left++;
        }
        
        maxLen = (right - left + 1 > maxLen) ? right - left + 1 : maxLen;
    }
    
    return maxLen;
}
```

#### 5. Matrix Traversal (Medium)
**Example: Number of Islands**
```c
void dfs(char** grid, int gridSize, int* gridColSize, int i, int j) {
    if (i < 0 || i >= gridSize || j < 0 || j >= gridColSize[i] || grid[i][j] != '1') {
        return;
    }
    
    grid[i][j] = '0'; // Mark as visited
    
    dfs(grid, gridSize, gridColSize, i+1, j);
    dfs(grid, gridSize, gridColSize, i-1, j);
    dfs(grid, gridSize, gridColSize, i, j+1);
    dfs(grid, gridSize, gridColSize, i, j-1);
}

int numIslands(char** grid, int gridSize, int* gridColSize) {
    int count = 0;
    
    for (int i = 0; i < gridSize; i++) {
        for (int j = 0; j < gridColSize[i]; j++) {
            if (grid[i][j] == '1') {
                dfs(grid, gridSize, gridColSize, i, j);
                count++;
            }
        }
    }
    
    return count;
}
```

### 🎯 Quick Implementation Templates

#### Two Pointers Template
```c
int twoPointers(int* arr, int n) {
    int left = 0, right = n - 1;
    
    while (left < right) {
        // Process current window
        if (condition) {
            left++;
        } else {
            right--;
        }
    }
    
    return result;
}
```

#### Binary Search Template
```c
int binarySearch(int* arr, int n, int target) {
    int left = 0, right = n - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1; // Not found
}
```

#### DFS Template
```c
void dfs(int x, int y) {
    // Base case
    if (outOfBounds(x, y) || visited[x][y]) return;
    
    // Mark visited
    visited[x][y] = 1;
    
    // Process current cell
    // ...
    
    // Explore neighbors
    dfs(x+1, y);
    dfs(x-1, y);
    dfs(x, y+1);
    dfs(x, y-1);
}
```

### ⚡ Speed Tips for OA

#### 1. Pre-written Helper Functions
```c
// Always have these ready
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))

void swap(int* a, int* b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int max(int a, int b) { return a > b ? a : b; }
int min(int a, int b) { return a < b ? a : b; }
```

#### 2. Common Data Structures (Static)
```c
// Stack
int stack[10000];
int top = -1;

void push(int val) { stack[++top] = val; }
int pop() { return stack[top--]; }
int peek() { return stack[top]; }
bool isEmpty() { return top == -1; }

// Queue
int queue[10000];
int front = 0, rear = -1;

void enqueue(int val) { queue[++rear] = val; }
int dequeue() { return queue[front++]; }
bool isEmpty() { return front > rear; }
```

#### 3. Quick Array Operations
```c
// Reverse array
void reverse(int* arr, int start, int end) {
    while (start < end) {
        swap(&arr[start], &arr[end]);
        start++;
        end--;
    }
}

// Find max/min
int findMax(int* arr, int n) {
    int max = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] > max) max = arr[i];
    }
    return max;
}
```

### 🚨 Common OA Mistakes to Avoid

1. **Off-by-one errors** in loops
2. **Null pointer dereference** - always check bounds
3. **Integer overflow** - use `long long` for large numbers
4. **Memory leaks** - avoid malloc in OA, use static arrays
5. **Infinite loops** - always have proper termination conditions

### 📝 OA Problem Checklist

Before submitting:
- [ ] Handle edge cases (empty array, single element)
- [ ] Check boundary conditions
- [ ] Verify return type matches expected format
- [ ] Test with provided examples
- [ ] Check for off-by-one errors
- [ ] Ensure no memory leaks

### 🎯 30-Min OA Success Formula

1. **Read carefully** - Understand constraints and examples
2. **Think simple** - Don't overcomplicate the solution
3. **Code fast** - Use templates and pre-written functions
4. **Test thoroughly** - Check edge cases before submitting
5. **Stay calm** - Manage time effectively, don't panic

---

## Basic Syntax

### Hello World
```c
#include <stdio.h>

int main() {
    printf("Hello, World!\n");
    return 0;
}
```

### Comments
```c
// Single line comment

/* Multi-line
   comment */
```

## Data Types

### Primitive Types
```c
int age = 25;           // Integer (4 bytes)
float price = 19.99f;   // Floating point (4 bytes)
double pi = 3.14159;    // Double precision (8 bytes)
char grade = 'A';       // Character (1 byte)
```

### Type Modifiers
```c
short int small = 100;     // Short integer (2 bytes)
long int big = 1000000L;   // Long integer (8 bytes)
unsigned int positive = 50; // Unsigned (only positive)
const int MAX_SIZE = 100;   // Constant (cannot be changed)
```

### Size of Types
```c
printf("Size of int: %zu bytes\n", sizeof(int));
printf("Size of float: %zu bytes\n", sizeof(float));
printf("Size of double: %zu bytes\n", sizeof(double));
printf("Size of char: %zu bytes\n", sizeof(char));
```

## Variables and Constants

### Variable Declaration
```c
int x, y, z;           // Multiple variables
int count = 0;         // Initialize
int a = 5, b = 10;     // Multiple initialization
```

### Constants
```c
#define PI 3.14159           // Preprocessor constant
const int MAX_STUDENTS = 50; // Compile-time constant
```

## Input/Output

### printf() Format Specifiers
```c
int num = 42;
float f = 3.14;
char ch = 'A';
char str[] = "Hello";

printf("Integer: %d\n", num);
printf("Float: %.2f\n", f);
printf("Character: %c\n", ch);
printf("String: %s\n", str);
printf("Hexadecimal: %x\n", num);
printf("Octal: %o\n", num);
```

### scanf() Input
```c
int age;
float height;
char name[50];

printf("Enter your age: ");
scanf("%d", &age);

printf("Enter your height: ");
scanf("%f", &height);

printf("Enter your name: ");
scanf("%s", name);
```

## Control Structures

### If-Else Statements
```c
int score = 85;

if (score >= 90) {
    printf("Grade: A\n");
} else if (score >= 80) {
    printf("Grade: B\n");
} else if (score >= 70) {
    printf("Grade: C\n");
} else {
    printf("Grade: F\n");
}
```

### Switch Statement
```c
char grade = 'B';

switch (grade) {
    case 'A':
        printf("Excellent!\n");
        break;
    case 'B':
        printf("Good!\n");
        break;
    case 'C':
        printf("Average\n");
        break;
    default:
        printf("Invalid grade\n");
}
```

### Loops

#### For Loop
```c
for (int i = 0; i < 10; i++) {
    printf("%d ", i);
}
printf("\n");
```

#### While Loop
```c
int i = 0;
while (i < 10) {
    printf("%d ", i);
    i++;
}
printf("\n");
```

#### Do-While Loop
```c
int i = 0;
do {
    printf("%d ", i);
    i++;
} while (i < 10);
printf("\n");
```

## Arrays

### Array Declaration and Initialization
```c
int numbers[5] = {1, 2, 3, 4, 5};  // Initialize
int arr[10];                        // Declare only
int matrix[3][3] = \{\{1,2,3\}, \{4,5,6\}, \{7,8,9\}\}; // 2D array
```

### Array Operations
```c
int arr[5] = {10, 20, 30, 40, 50};

// Access elements
printf("First element: %d\n", arr[0]);
printf("Last element: %d\n", arr[4]);

// Modify elements
arr[0] = 100;

// Loop through array
for (int i = 0; i < 5; i++) {
    printf("arr[%d] = %d\n", i, arr[i]);
}
```

## Strings

### String Declaration
```c
char str1[] = "Hello";           // Array of chars
char str2[20] = "World";         // Fixed size
char *str3 = "Programming";      // String literal
```

### String Functions
```c
#include <string.h>

char str1[20] = "Hello";
char str2[20] = "World";
char result[40];

// String length
int len = strlen(str1);
printf("Length: %d\n", len);

// String copy
strcpy(result, str1);
printf("Copied: %s\n", result);

// String concatenation
strcat(result, " ");
strcat(result, str2);
printf("Concatenated: %s\n", result);

// String comparison
if (strcmp(str1, str2) == 0) {
    printf("Strings are equal\n");
} else {
    printf("Strings are different\n");
}
```

## Functions

### Function Declaration and Definition
```c
// Function declaration (prototype)
int add(int a, int b);
void printMessage(char message[]);

// Function definition
int add(int a, int b) {
    return a + b;
}

void printMessage(char message[]) {
    printf("Message: %s\n", message);
}

// Function call
int result = add(5, 3);
printMessage("Hello from function!");
```

### Function with Array Parameter
```c
void printArray(int arr[], int size) {
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    printArray(numbers, 5);
    return 0;
}
```

## Pointers

### Pointer Basics
```c
int x = 42;
int *ptr = &x;  // Pointer to x

printf("Value of x: %d\n", x);
printf("Address of x: %p\n", &x);
printf("Value via pointer: %d\n", *ptr);
printf("Pointer address: %p\n", ptr);
```

### Pointer Arithmetic
```c
int arr[] = {10, 20, 30, 40, 50};
int *ptr = arr;  // Points to first element

printf("First element: %d\n", *ptr);
printf("Second element: %d\n", *(ptr + 1));
printf("Third element: %d\n", *(ptr + 2));

// Increment pointer
ptr++;
printf("After increment: %d\n", *ptr);
```

### Dynamic Memory Allocation
```c
#include <stdlib.h>

// Allocate memory
int *dynamicArray = (int*)malloc(5 * sizeof(int));

if (dynamicArray == NULL) {
    printf("Memory allocation failed\n");
    return 1;
}

// Use allocated memory
for (int i = 0; i < 5; i++) {
    dynamicArray[i] = i * 10;
}

// Free memory
free(dynamicArray);
dynamicArray = NULL;
```

## Structures

### Structure Definition and Usage
```c
struct Student {
    char name[50];
    int age;
    float gpa;
};

// Create structure variable
struct Student student1;
strcpy(student1.name, "John Doe");
student1.age = 20;
student1.gpa = 3.8;

// Access structure members
printf("Name: %s\n", student1.name);
printf("Age: %d\n", student1.age);
printf("GPA: %.2f\n", student1.gpa);
```

### Typedef for Structures
```c
typedef struct {
    int x, y;
} Point;

Point p1 = {10, 20};
Point p2 = {30, 40};

printf("Point 1: (%d, %d)\n", p1.x, p1.y);
printf("Point 2: (%d, %d)\n", p2.x, p2.y);
```

## File Operations

### File Reading and Writing
```c
#include <stdio.h>

// Write to file
FILE *file = fopen("data.txt", "w");
if (file != NULL) {
    fprintf(file, "Hello, File!\n");
    fprintf(file, "This is line 2\n");
    fclose(file);
}

// Read from file
file = fopen("data.txt", "r");
if (file != NULL) {
    char line[100];
    while (fgets(line, sizeof(line), file) != NULL) {
        printf("%s", line);
    }
    fclose(file);
}
```

## Common Libraries

### Math Library
```c
#include <math.h>

double x = 16.0;
printf("Square root: %.2f\n", sqrt(x));
printf("Power: %.2f\n", pow(2, 3));
printf("Absolute value: %.2f\n", fabs(-5.5));
printf("Ceiling: %.2f\n", ceil(4.3));
printf("Floor: %.2f\n", floor(4.7));
```

### Time Library
```c
#include <time.h>

time_t current_time;
time(&current_time);
printf("Current time: %s", ctime(&current_time));
```

## Error Handling

### Basic Error Handling
```c
#include <errno.h>
#include <string.h>

FILE *file = fopen("nonexistent.txt", "r");
if (file == NULL) {
    printf("Error opening file: %s\n", strerror(errno));
    return 1;
}
```

## Preprocessor Directives

### Common Directives
```c
#include <stdio.h>        // Include header file
#define MAX_SIZE 100      // Define macro
#define SQUARE(x) ((x) * (x))  // Function-like macro

#ifdef DEBUG              // Conditional compilation
    printf("Debug mode\n");
#endif

#ifndef PI               // If not defined
    #define PI 3.14159
#endif
```

## Memory Management

### Memory Functions
```c
#include <stdlib.h>
#include <string.h>

// Allocate and initialize memory
int *arr = (int*)calloc(5, sizeof(int));

// Reallocate memory
arr = (int*)realloc(arr, 10 * sizeof(int));

// Copy memory
int src[] = {1, 2, 3, 4, 5};
int dest[5];
memcpy(dest, src, sizeof(src));

// Compare memory
if (memcmp(src, dest, sizeof(src)) == 0) {
    printf("Memory blocks are equal\n");
}

// Free memory
free(arr);
```

## Common Patterns

### Swap Function
```c
void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    int x = 10, y = 20;
    printf("Before swap: x=%d, y=%d\n", x, y);
    swap(&x, &y);
    printf("After swap: x=%d, y=%d\n", x, y);
    return 0;
}
```

### Binary Search
```c
int binarySearch(int arr[], int left, int right, int target) {
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid] == target) {
            return mid;
        }
        
        if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1; // Not found
}
```

## Quick Reference

### Operators
```c
// Arithmetic: +, -, *, /, %
// Assignment: =, +=, -=, *=, /=
// Comparison: ==, !=, <, >, <=, >=
// Logical: &&, ||, !
// Bitwise: &, |, ^, ~, <<, >>
// Increment/Decrement: ++, --
// Conditional: ? :
// Address/Indirection: &, *
```

### Escape Sequences
```c
printf("Newline: \\n");
printf("Tab: \\t");
printf("Backslash: \\\\");
printf("Quote: \\\"");
printf("Single quote: \\'");
printf("Carriage return: \\r");
printf("Form feed: \\f");
printf("Bell: \\a");
```

### Format Specifiers
```c
// %d - int
// %ld - long int
// %f - float
// %lf - double
// %c - char
// %s - string
// %p - pointer
// %x - hexadecimal
// %o - octal
// %u - unsigned int
// %zu - size_t
```

---
