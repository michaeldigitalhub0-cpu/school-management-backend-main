# School Management System — Backend API

A RESTful API for managing students, teachers, classes, attendance, grades, timetables, and announcements. Built with Node.js, Express, and MySQL (TiDB Cloud).

---

## Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Scripts](#-scripts)
- [Contributing](#-contributing)
- [License](#-license)

---

## Features

- **Authentication** — JWT-based login with access + refresh tokens, HTTP-only cookies
- **Role-based access control** — Admin, Teacher, Student
- **Student management** — Create, update, delete, view students with guardian info
- **Teacher management** — Assign form teachers, link subjects
- **Class hierarchy** — Domain → Group → Arm (e.g. Junior → JSS1 → A)
- **Subject management** — Assign subjects to class groups and teachers
- **Attendance** — Daily attendance tracking per class arm
- **Grades** — Continuous assessment + exam scores per term
- **Timetable** — Weekly schedule per class arm
- **Announcements** — Audience-based broadcasts (all / students / teachers)
- **Security** — CORS, bcrypt password hashing

---

## Tech Stack

| Layer             | Technology                        |
|-------------------|------------------------------- ---|
| Runtime           | Node.js                           |
| Framework         | Express 5                         |
| Database          | MySQL (TiDB Cloud Serverless)     |
| Auth              | JSON Web Tokens (JWT)             |
| Password hashing  | bcryptjs                          |
| Validation        | Joi                               |
| Security          | CORS, bcrypt password hashing     |
| Deployment        | Render                            |

---

## Architecture

Client (HTML/CSS/JS)
│
▼
┌──────────────────────────────┐
│ Express API (Render)         │
│                              │
│ Routes → Middleware →        │
│ Controllers → Services →     │
│ Database Pool                │
└──────────────────────────────┘
│
▼
TiDB Cloud


**Request flow:**

1. Route matched in `src/routes/`
2. `validateToken` middleware verifies JWT from cookie
3. `roleCheck` middleware enforces role permissions
4. `validateSchema` validates request body with Joi
5. Controller calls service layer
6. Service queries TiDB via connection pool
7. Response returned as JSON

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A TiDB Cloud Serverless cluster ([free tier](https://tidbcloud.com))
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/school-management-backend.git
cd school-management-backend

# Install dependencies
npm install

# Copy the environment template
cp .env.example .env

# Fill in your credentials (see Environment Variables below)

# ===== Server =====
SERVER_PORT=5000
SERVER_HOST=localhost
REQUEST_URL=http://localhost:5173

# ===== Authentication =====
ACCESS_KEY=<random 64-char hex string>
REFRESH_KEY=<random 64-char hex string>
TOKEN_EXPIRES_IN=1h

# ===== Database (TiDB Cloud) =====
DB_HOST=gateway01.xxx.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=xxxxxx.root
DB_PASSWORD=<your_tidb_password>
DB_NAME=school_management_system

# ===== Local SSL Cert (Windows only) =====
CA_PATH=./isrgrootx1.pem

AUTHOR MICHAEL