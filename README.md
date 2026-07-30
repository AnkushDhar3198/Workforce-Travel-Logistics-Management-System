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

## 2. Database Parameters Configuration Guide

The database credentials provided in [db_connection.txt](file:///c:/Users/Trinankur/Desktop/Ankush/project_materials/db_connection.txt) are configured in the Spring Boot backend. 

If you need to update credentials or configure a different database host, modify the properties file at:
[backend/src/main/resources/application.yml](file:///c:/Users/Trinankur/Desktop/Ankush/backend/src/main/resources/application.yml)

### Parameter Mapping Schema

Map properties from the connection text file into the YAML configuration file according to the parameters below:

| Property in `db_connection.txt` | Mapped YAML Path | Target Value |
|---|---|---|
| `PGHOST` | `spring.datasource.url` | Hostname inside the JDBC URL connection string: `jdbc:postgresql://<PGHOST>:5432/neondb` |
| `PGDATABASE` | `spring.datasource.url` | Database name path at the end of the JDBC string: `/neondb` |
| `PGUSER` | `spring.datasource.username` | `neondb_owner` |
| `PGPASSWORD` | `spring.datasource.password` | `npg_e9JDmCMfIcn2` |
| `PGSSLMODE` | `spring.datasource.url` | Query parameter added to connection string: `?sslmode=require` |

### Resulting `application.yml` block:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://ep-rapid-voice-azjk3ju5-pooler.c-3.ap-southeast-1.aws.neon.tech:5432/neondb?sslmode=require
    username: neondb_owner
    password: npg_e9JDmCMfIcn2
    driver-class-name: org.postgresql.Driver
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: update
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
