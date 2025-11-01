Task Manager
A full-stack task management website built as a personal project. This project features a comprehensive user dashboard, OTP-based authentication, progress tracking, and team collaboration capabilities.

Repository: https://github.com/MinhPham204/TaskManager

🚀 Key Features
This project provides a complete solution for managing both personal and team-based tasks:

Authentication & Security:

Secure user registration and login using JWT (JSON Web Tokens).

OTP (One-Time Password) verification for both new account registration and password resets.

Passwords are securely hashed using bcryptjs.

Task Management:

Full CRUD (Create, Read, Update, Delete) functionality for tasks.

Set priorities (low, medium, high) and due dates for each task.

Automated task status updates (e.g., "pending," "in progress," "completed").

Team Collaboration:

Allows users to work together in a shared workspace.

Tracking & Reporting:

Intuitive user dashboard to track overall progress.

Report download functionality for analysis.

Additional Features:

File attachments for tasks.

Utilizes Redis for caching OTPs, improving response speed and reducing load on the main database.

🛠️ Tech Stack
This project is built with the modern MERN stack and other powerful technologies.

Frontend
React.js: The primary JavaScript library for building the user interface.

Redux Toolkit: Global state management for the application.

Tailwind CSS: A utility-first CSS framework for rapid and flexible styling.

Backend
Node.js: Server-side JavaScript runtime environment.

Express.js: Minimalist web framework for building the API.

MongoDB: Primary NoSQL database (stores user info, tasks, etc.).

Mongoose: ODM (Object Data Modeling) library for structured interaction with MongoDB.

Redis: In-memory key-value database, used for caching OTPs and managing sessions.

Authentication & Security
JSON Web Tokens (JWT): Generates tokens for authenticating API requests.

Bcrypt.js: Password hashing library.

🏁 Getting Started
To run this project on your local machine, follow these steps:

Prerequisites:
Node.js (v16 or later)

MongoDB (A local instance or an Atlas connection string)

Redis (A local instance or a cloud instance)

Backend Installation
1. Clone the repository:

Bash

git clone https://github.com/MinhPham204/TaskManager.git
cd TaskManager/backend
2. Install dependencies:

Bash

npm install
3. Create a .env file and add the necessary environment variables (e.g., MONGO_URI, JWT_SECRET, REDIS_URL, email credentials for OTP).

4. Start the server:

Bash

npm start
Frontend Installation
1. Navigate to the frontend directory:

Bash

cd ../frontend
2. Install dependencies:

Bash

npm install
3. Set your backend API address (usually in a .env file).

4. Start the React application:

Bash

npm start
