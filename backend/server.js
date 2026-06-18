// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { initSocket } from "./utils/socket.js";

// Import routes
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/ProjectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import commentRoutes from "./routes/commentRoutes.js"; // RENAMED from messageRoutes
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from './routes/userRoutes.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// Define allowed origins for both CORS and Socket.IO
const allowedOrigins = [
  'http://localhost:5173', // Vite default port
  'http://localhost:3000', // React default port
  'http://51.20.85.41', // Your EC2 Public IP
  // Add your domain name here if you have one
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes - UPDATED
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes); // RENAMED from messages
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);

// REMOVED ROUTES (no longer needed):
// app.use("/api/proposals", proposalRoutes);
// app.use("/api/deliverables", deliverableRoutes);
// app.use("/api/payment", paymentRoutes);
// app.use("/api/feedback", feedbackRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Project Management Tool API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: "Something went wrong!",
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const server = http.createServer(app);

// Pass the allowedOrigins to the socket initializer
initSocket(server, allowedOrigins);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`  - POST /api/auth/login`);
  console.log(`  - POST /api/auth/signup`);
  console.log(`  - GET /api/projects`);
  console.log(`  - GET /api/tasks/my-tasks`);
  console.log(`  - GET /api/comments/task/:taskId`);
  console.log(`  - GET /api/notifications`);
});