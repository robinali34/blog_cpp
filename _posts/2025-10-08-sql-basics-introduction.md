---
layout: post
title: "SQL Basics: Introduction to Structured Query Language"
date: 2025-10-08 12:13:55 -0700
categories: programming sql tutorial database relational-database crud operations query language data-management
---

# SQL Basics: Introduction to Structured Query Language

SQL (Structured Query Language) — the language used to manage and manipulate relational databases.

## What is SQL?

- **SQL** stands for **Structured Query Language**
- It is a **standard language** used to communicate with relational databases
- SQL lets you **create, read, update, and delete** data (CRUD operations)
- Works with **tables** organized in rows and columns

## Basic Concepts

| Term | Meaning |
|------|---------|
| **Database** | Collection of organized data |
| **Table** | Data stored in rows and columns |
| **Row (Record)** | One entry in a table |
| **Column (Field)** | Attribute of data in a row |
| **Query** | Request to perform an operation on the database |

## Common SQL Commands

| Command | Description | Example |
|---------|-------------|---------|
| `SELECT` | Retrieve data from a table | `SELECT * FROM employees;` |
| `INSERT` | Add new data into a table | `INSERT INTO employees VALUES (1, 'Alice', 30);` |
| `UPDATE` | Modify existing data | `UPDATE employees SET age=31 WHERE id=1;` |
| `DELETE` | Remove data | `DELETE FROM employees WHERE id=1;` |
| `CREATE` | Create a new table or database | `CREATE TABLE employees (id INT, name VARCHAR(50));` |
| `DROP` | Delete a table or database | `DROP TABLE employees;` |

## Example Table: employees

| id | name  | age |
|----|-------|-----|
| 1  | Alice | 30  |
| 2  | Bob   | 25  |
| 3  | Carol | 28  |

## Sample Queries

### Select all employees:
```sql
SELECT * FROM employees;
```

### Select employees older than 27:
```sql
SELECT name, age FROM employees WHERE age > 27;
```

### Add a new employee:
```sql
INSERT INTO employees (id, name, age) VALUES (4, 'David', 22);
```

### Update Bob's age:
```sql
UPDATE employees SET age = 26 WHERE name = 'Bob';
```

### Delete employee with id 3:
```sql
DELETE FROM employees WHERE id = 3;
```

## Key Features of SQL

1. **Declarative language**: You specify what you want, not how to get it
2. **Supports joins** to combine data from multiple tables
3. **Allows aggregation** (COUNT, SUM, AVG)
4. **Supports transactions** for grouping multiple operations
5. **Has security features** like permissions and roles

## Advanced SQL Concepts

### Joins
Combine data from multiple tables:

```sql
SELECT e.name, d.department_name 
FROM employees e 
JOIN departments d ON e.department_id = d.id;
```

### Aggregation Functions
```sql
SELECT 
    COUNT(*) as total_employees,
    AVG(age) as average_age,
    MAX(age) as oldest_age
FROM employees;
```

### Grouping
```sql
SELECT department_id, COUNT(*) as employee_count
FROM employees 
GROUP BY department_id;
```

### Filtering with HAVING
```sql
SELECT department_id, COUNT(*) as employee_count
FROM employees 
GROUP BY department_id
HAVING COUNT(*) > 5;
```

## Data Types

| Type | Description | Example |
|------|-------------|---------|
| `INT` | Integer numbers | `123` |
| `VARCHAR(n)` | Variable character string | `'Hello'` |
| `CHAR(n)` | Fixed character string | `'ABC'` |
| `DECIMAL(p,s)` | Decimal numbers | `123.45` |
| `DATE` | Date values | `'2025-10-08'` |
| `BOOLEAN` | True/False values | `TRUE` |

## Best Practices

1. **Use meaningful table and column names**
2. **Always use WHERE clauses** with UPDATE and DELETE
3. **Use transactions** for multiple related operations
4. **Index frequently queried columns**
5. **Normalize your database** to avoid redundancy
6. **Use prepared statements** to prevent SQL injection

## Common SQL Databases

- **MySQL** - Open source, widely used
- **PostgreSQL** - Advanced open source database
- **SQLite** - Lightweight, embedded database
- **Oracle** - Enterprise database
- **SQL Server** - Microsoft's database system

## Related Topics

- **Database Design** - Creating efficient database schemas
- **Indexing** - Improving query performance
- **Transactions** - Ensuring data consistency
- **Stored Procedures** - Reusable SQL code blocks
- **Views** - Virtual tables based on queries

---

SQL is essential for anyone working with data. Start with these basics and gradually explore more advanced features as you build your database skills!
