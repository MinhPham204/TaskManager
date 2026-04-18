# Task Manager (SaaS Multi-Tenancy Architecture)

A robust, full-stack task management platform built as a personal project. This project features a comprehensive user dashboard, OTP-based authentication, team collaboration capabilities, and is architected to support SaaS multi-tenancy.

**Repository:** [https://github.com/MinhPham204/TaskManager](https://github.com/MinhPham204/TaskManager)

## Key Features

This project provides a complete solution for managing both personal and team-based tasks:

* **Authentication & Security:**
    * Secure user registration and login using **JWT (JSON Web Tokens)**.
    * **OTP (One-Time Password)** verification for both new account registration and password resets.
    * Passwords are securely hashed using **bcrypt**.
* **Task Management:**
    * Full CRUD (Create, Read, Update, Delete) functionality for tasks.
    * Set **priorities** (low, medium, high) and **due dates** for each task.
    * Automated task status updates (e.g., "pending," "in progress," "completed").
* **Team Collaboration (Multi-Tenancy):**
    * Create and manage teams with role-based access control (Admins, Users).
    * **Secure, Time-Limited Invitations:** Invite new members via email using a secure, one-time token.
    * Invitation links are cached in **Redis** with a 24-hour expiry to ensure security.
    * Search and add existing users in the system directly to the team.
* **API Documentation:**
    * Fully documented API endpoints using **Swagger UI**, integrated directly into the backend for easy testing and exploration.
* **Performance & Infrastructure:**
    * **Dockerized Backend:** Entire backend infrastructure (API, Database, Cache) is containerized for consistent development and deployment.
    * **Redis-Powered Caching:** Utilizes Redis for caching time-sensitive data (OTPs, Invitation Tokens), significantly improving response speed.
    * **MongoDB Replica Set:** Configured to support ACID transactions required for complex multi-tenant data operations.

## Tech Stack

This project is built with a modern, scalable architecture.

### **Backend (Containerized)**
* **NestJS & TypeScript:** A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
* **MongoDB:** Primary NoSQL database (configured as a Replica Set).
* **Mongoose:** ODM library for structured interaction with MongoDB.
* **Redis:** In-memory data structure store, used for caching and sessions.
* **Docker & Docker Compose:** Containerization and orchestration for the backend environment.
* **Swagger:** Automated API documentation.

### **Frontend**
* **React.js:** The primary JavaScript library for building the user interface.
* **Redux Toolkit:** Global state management for the application.
* **Tailwind CSS:** A utility-first CSS framework for rapid and flexible styling.

---

## Getting Started

Follow these steps to run the project on your local machine. The backend is fully dockerized, making setup incredibly fast.

### **Prerequisites:**
* **Docker Desktop** (Required for the backend)
* **Node.js** (v16 or later - Required for the frontend)
* **Git**

### **1. Backend Installation (via Docker)**

1. Clone the repository:
   ```bash
   git clone https://github.com/MinhPham204/TaskManager.git
   cd TaskManager/backend
   ```

2. Configure Environment Variables:
   Create a `.env` file in the `backend` directory based on the provided example.
   ```bash
   cp .env.example .env
   ```
   *(Ensure you fill in your specific credentials like `EMAIL_USER` and `EMAIL_PASS` for OTP functionality).*

3. Start the Docker Containers:
   ```bash
   docker-compose up -d --build
   ```

4. **Crucial Step - Initialize MongoDB Replica Set:**
   Since this is a fresh database instance, you must initialize the replica set for Mongoose transactions to work. Run this command once:
   ```bash
   docker exec -it task_manager_db mongosh --eval "rs.initiate()"
   ```

5. Explore the API:
   The backend is now running. Open your browser and navigate to the Swagger documentation:
    **`http://localhost:8001/api/docs`**

### **2. Frontend Installation**

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file and set your backend API address (e.g., `VITE_API_URL=http://localhost:8001`).

4. Start the React application:
   ```bash
   npm run dev
   ```