# TaskFlow - Project Management Tool

A full-stack Project Management Tool built using the MERN Stack. The application helps teams collaborate efficiently by creating projects, assigning tasks, tracking progress, and communicating in real-time.

## Features

### Authentication

* User Registration
* User Login
* JWT Authentication
* Protected Routes

### Project Management

* Create Projects
* Update Projects
* Delete Projects
* View Project Details

### Task Management

* Create Tasks
* Assign Tasks to Team Members
* Task Status Tracking

  * Todo
  * In Progress
  * Done
* Task Priority

  * Low
  * Medium
  * High
* Due Date Tracking

### Team Collaboration

* Team Member Assignment
* Project Discussions
* Comments
* Real-Time Messaging

### Notifications

* Task Updates
* Assignment Notifications
* Project Activity Alerts

### Dashboard

* Project Overview
* Task Statistics
* Progress Tracking

## Tech Stack

### Frontend

* React
* Vite
* React Router
* Axios
* Socket.io Client

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Socket.io

## Project Structure

```text
taskflow/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── package.json
│
├── .gitignore
├── package.json
└── README.md
```

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd taskflow
```

### Install Dependencies

```bash
yarn install
```

### Setup Environment Variables

Create a `.env` file inside the backend folder.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### Run Backend

```bash
cd backend
yarn dev
```

### Run Frontend

```bash
cd frontend
yarn dev
```

### Run Both Together (Optional)

```bash
yarn dev
```

## Future Enhancements

* File Uploads
* Activity Logs
* Email Notifications
* Dark Mode
* Advanced Analytics
* Kanban Drag & Drop Board

## Author

Developed as a MERN Stack Project Management Tool.
