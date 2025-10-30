---
layout: post
title: "PostgreSQL with Python: Complete Guide with Flask API"
date: 2025-10-08 16:11:34 -0700
categories: programming python postgresql database flask api crud operations psycopg2 web-development backend
---

# PostgreSQL with Python: Complete Guide with Flask API

Learn how to connect to PostgreSQL using Python, perform CRUD operations, and build a complete Flask REST API.

## What You'll Learn

- How to connect to PostgreSQL using Python
- Perform basic CRUD operations
- Use `psycopg2` (the most widely used PostgreSQL adapter for Python)
- Build a complete Flask REST API with PostgreSQL

## Prerequisites

- Python 3 installed
- PostgreSQL server installed and running
- Python package `psycopg2` installed:

```bash
pip install psycopg2
```

Or for safer builds (no C dependencies):
```bash
pip install psycopg2-binary
```

## Part 1: Basic PostgreSQL Operations with Python

### 1. Connect to PostgreSQL from Python

```python
import psycopg2

# Connect to PostgreSQL
conn = psycopg2.connect(
    host="localhost",
    database="mydb",
    user="myuser",
    password="mypassword"
)

# Create a cursor
cur = conn.cursor()

# Show PostgreSQL version
cur.execute("SELECT version();")
print("PostgreSQL version:", cur.fetchone())

# Clean up
cur.close()
conn.close()
```

### 2. Create a Table

```python
cur = conn.cursor()
cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        age INT
    );
""")
conn.commit()
cur.close()
```

### 3. Insert Data

```python
cur = conn.cursor()
cur.execute("INSERT INTO users (name, age) VALUES (%s, %s)", ("Alice", 30))
conn.commit()
cur.close()
```

### 4. Query Data

```python
cur = conn.cursor()
cur.execute("SELECT * FROM users;")
rows = cur.fetchall()

for row in rows:
    print(f"ID: {row[0]}, Name: {row[1]}, Age: {row[2]}")

cur.close()
```

### 5. Update Data

```python
cur = conn.cursor()
cur.execute("UPDATE users SET age = %s WHERE name = %s", (31, "Alice"))
conn.commit()
cur.close()
```

### 6. Delete Data

```python
cur = conn.cursor()
cur.execute("DELETE FROM users WHERE name = %s", ("Alice",))
conn.commit()
cur.close()
```

### 7. Always Close Connections

Always call:
```python
conn.commit()
cur.close()
conn.close()
```

Or better, use context managers:
```python
with conn.cursor() as cur:
    cur.execute("SELECT ...")
```

### 8. Bonus: Use DictCursor for Dictionary-like Rows

```python
from psycopg2.extras import DictCursor

conn = psycopg2.connect(...)
cur = conn.cursor(cursor_factory=DictCursor)
cur.execute("SELECT * FROM users")
for row in cur.fetchall():
    print(row['name'], row['age'])
```

## Part 2: Flask API with PostgreSQL

### Project Structure

```
flask_postgres_api/
├── app.py
├── db.py
└── requirements.txt
```

### requirements.txt

```
flask
psycopg2-binary
```

Install dependencies:
```bash
pip install -r requirements.txt
```

### PostgreSQL Setup

Create a database and user (via psql or pgAdmin):

```sql
CREATE DATABASE mydb;
CREATE USER myuser WITH PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;
```

And create a simple table:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    age INT
);
```

### db.py — PostgreSQL Connection

```python
# db.py
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    conn = psycopg2.connect(
        host='localhost',
        database='mydb',
        user='myuser',
        password='mypassword',
        cursor_factory=RealDictCursor  # Returns dict rows
    )
    return conn
```

### app.py — Flask REST API

```python
# app.py
from flask import Flask, request, jsonify
from db import get_db_connection

app = Flask(__name__)

# GET all users
@app.route('/api/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users;")
    users = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(users)

# GET user by ID
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = %s;", (user_id,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if user:
        return jsonify(user)
    return jsonify({'error': 'User not found'}), 404

# POST create new user
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    name = data['name']
    age = data['age']

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO users (name, age) VALUES (%s, %s) RETURNING *;", (name, age))
    new_user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return jsonify(new_user), 201

# PUT update user
@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    name = data.get('name')
    age = data.get('age')

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE users SET name = %s, age = %s WHERE id = %s RETURNING *;", (name, age, user_id))
    updated_user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if updated_user:
        return jsonify(updated_user)
    return jsonify({'error': 'User not found'}), 404

# DELETE user
@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE id = %s RETURNING id;", (user_id,))
    deleted = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if deleted:
        return jsonify({'message': f'User {user_id} deleted'})
    return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)
```

## Running the API

```bash
python app.py
```

Visit: `http://localhost:5000/api/users` → List all users

## API Testing Examples

### Sample POST Request (create user)

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "age": 30}'
```

### Sample PUT Request (update user)

```bash
curl -X PUT http://localhost:5000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Updated", "age": 31}'
```

### Sample DELETE Request

```bash
curl -X DELETE http://localhost:5000/api/users/1
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/<id>` | Get user by ID |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/<id>` | Update user |
| DELETE | `/api/users/<id>` | Delete user |

## Best Practices

1. **Use parameterized queries** to prevent SQL injection
2. **Always close connections** and cursors
3. **Use context managers** when possible
4. **Handle exceptions** properly
5. **Use transactions** for multiple operations
6. **Validate input data** before database operations

## Error Handling Example

```python
@app.route('/api/users', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        if not data or 'name' not in data or 'age' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        name = data['name']
        age = data['age']
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO users (name, age) VALUES (%s, %s) RETURNING *;", (name, age))
        new_user = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify(new_user), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## Next Steps

- Add authentication and authorization
- Implement pagination for large datasets
- Add input validation and sanitization
- Use an ORM like SQLAlchemy for complex applications
- Add logging and monitoring
- Deploy to production with proper security measures

## Related Topics

- **SQLAlchemy** - Python SQL toolkit and ORM
- **Database Migrations** - Managing schema changes
- **Connection Pooling** - Optimizing database connections
- **Docker** - Containerizing PostgreSQL and Flask
- **API Documentation** - Using tools like Swagger/OpenAPI
