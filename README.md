# VoyaCore – Enterprise Workforce Travel &amp; Logistics Management System

A centralized platform for planning, approving, managing, and monitoring employee business travel while coordinating synchronized transportation of physical business assets (samples, prototypes, exhibition booths, marketing materials) required during that travel.

---

## 1. Setup Instructions

To get the development workspace set up, check that the following system environments are configured:

### Prerequisites
* **Java Development Kit (JDK) 17 or higher**
  * The system's pre-installed **JDK 22** (`C:\Program Files\Java\jdk-22`) is used for this project.
* **Node.js (v20.x or higher) & npm**
  * Node.js version `v20.19.3` is installed in this workspace.

### Workspace Folder Structure
Ensure you have the following directories created in the workspace:
* `/backend` - Spring Boot backend project folder.
* `/frontend` - React + Vite + TypeScript frontend folder.
* `/apache-maven-3.9.8` - Local Maven binary directory.

---

## 2. Environment & Database Configuration Guide

The database parameters and other application configurations have been secured and are loaded dynamically from environment variables.

### Local Environment Files
To run the applications locally, configure environment variables in `.env` files:
1. **Backend**: Copy [backend/.env.example](file:///c:/Users/Trinankur/Desktop/Ankush/backend/.env.example) to `backend/.env` and update the values.
2. **Frontend**: Copy [frontend/.env.example](file:///c:/Users/Trinankur/Desktop/Ankush/frontend/.env.example) to `frontend/.env` and update the values.

These `.env` files are ignored by git to keep your production credentials secure.

### Backend Parameter Mapping Schema
The database credentials provided in [db_connection.txt](file:///c:/Users/Trinankur/Desktop/Ankush/project_materials/db_connection.txt) map to the following backend environment variables:

| Property in `db_connection.txt` | Environment Variable | Purpose |
|---|---|---|
| `PGHOST` | `PGHOST` | Database host |
| `PGDATABASE` | `PGDATABASE` | Database name |
| `PGUSER` | `PGUSER` | Database username |
| `PGPASSWORD` | `PGPASSWORD` | Database password |
| `PGSSLMODE` | `PGSSLMODE` | SSL Mode (e.g. `require`) |

Alternatively, you can override the full connection settings using:
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SERVER_PORT` (Server running port, defaults to `8080`)
- `APP_JWT_SECRET` (JWT signing key)

### Secured `application.yml` block:
```yaml
server:
  port: ${SERVER_PORT:8080}

spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://${PGHOST:localhost}:5432/${PGDATABASE:neondb}}
    username: ${SPRING_DATASOURCE_USERNAME:${PGUSER:postgres}}
    password: ${SPRING_DATASOURCE_PASSWORD:${PGPASSWORD:}}
    driver-class-name: org.postgresql.Driver
```

---

## 3. Server Running Guide

### Step 1: Running the Backend (Spring Boot Server)

1. Open a terminal (PowerShell) and navigate to the `backend` folder:
   ```powershell
   cd backend
   ```
2. Configure the Java 22 path variable and execute Spring Boot via Maven:
   ```powershell
   $env:JAVA_HOME="C:\Program Files\Java\jdk-22"
   ..\apache-maven-3.9.8\bin\mvn.cmd spring-boot:run
   ```
   *The server compiles the code, automatically updates the Neon schema tables, seeds the database, and begins listening on port **`8080`**.*

### Step 2: Running the Frontend (Vite Dev Server)

1. Open a new terminal session and navigate to the `frontend` folder:
   ```powershell
   cd frontend
   ```
2. Install the node package dependencies (handling peer dependencies):
   ```powershell
   npm install --legacy-peer-deps
   ```
3. Start the hot-reloading development server:
   ```powershell
   npm run dev
   ```
   *The client server begins listening on port **`5173`**.*

---

## 4. Pre-seeded Demo Accounts

Use these pre-seeded credentials to explore the different dashboards:

| Role Name | Demo Email | Password |
|---|---|---|
| **Traveling Employee** | `employee@cbg.com` | `password` |
| **Approving Manager** | `manager@cbg.com` | `password` |
| **Corporate Travel Manager** | `travelmanager@cbg.com` | `password` |
| **Finance & Procurement** | `finance@cbg.com` | `password` |
| **Security & Risk Officer** | `security@cbg.com` | `password` |
| **Logistics Coordinator** | `logistics@cbg.com` | `password` |
| **Admin** | `admin@cbg.com` | `password` |
