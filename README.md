# ✈️ VoyaCore — Workforce Travel & Logistics Management System

An enterprise-grade, level-5 autonomous workforce travel, duty-of-care security, customs logistics manifest, and automated expense auditing management system built with Spring Boot (Java 21), React, Tailwind CSS, PostgreSQL, OpenPDF, SSE Real-Time Communication, and WebRTC Voice Calling.

---

## 🔑 Official Application Corporate Accounts

For testing, auditing, and instant role verification login, use these pre-seeded official corporate credentials:

| Corporate Role | Official Email | Default Password | Designation |
| :--- | :--- | :--- | :--- |
| **Traveling Employee** | `employee@voyacore.com` | `VoyaCore2026!` | Senior Software Engineer |
| **Approving Manager** | `manager@voyacore.com` | `VoyaCore2026!` | Engineering Director |
| **Corporate Travel Manager** | `travel.manager@voyacore.com` | `VoyaCore2026!` | Corporate Travel Manager |
| **Finance & Procurement** | `finance@voyacore.com` | `VoyaCore2026!` | Chief Procurement Officer |
| **Security & Risk Officer** | `security@voyacore.com` | `VoyaCore2026!` | Global Security Chief |
| **Logistics Coordinator** | `logistics@voyacore.com` | `VoyaCore2026!` | Global Logistics Lead |
| **System Administrator** | `admin@voyacore.com` | `VoyaCore2026!` | System Administrator |

---

## ✨ Features & Architecture

- **Real-Time Communication**: Server-Sent Events (SSE) live event streams & email event logging.
- **On-Demand Registration**: Official 6-step corporate onboarding form with instant field validation and auto country dial-code detection.
- **Voice Calling System**: Integrated WebRTC voice phone dialer for instant emergency contacts and security desk calling.
- **Duty-of-Care & Heatmap**: Destination risk monitoring, weather advisories, and single-click SOS satellite dispatch.
- **PDF Generation**: OpenPDF dynamic itinerary export and expense claim summary reports.
- **Policy Engine**: Real-time compliance checking for travel budgets, lead times, and preferred vendor rate locking.

---

## 🚀 Running Locally

### Backend (Spring Boot + JDK 21)
```bash
cd backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
mvn clean spring-boot:run
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
