import { Server } from "socket.io";

let io;

export const initSocket = (server, allowedOrigins = "*") => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.on("register", ({ userId }) => {
      try {
        if (!userId) return;
        const room = `user_${userId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} registered for user ${userId} in room ${room}`);
        // Send confirmation
        socket.emit("registered", { userId, room });
      } catch (e) {
        console.error("register error", e);
      }
    });

    socket.on("joinProject", ({ projectId }) => {
      try {
        if (!projectId) return;
        const room = `project_${projectId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      } catch (e) {
        console.error("joinProject error", e);
      }
    });

    socket.on("sendNotification", ({ userId, message, data }) => {
      try {
        if (!userId) return;
        const room = `user_${userId}`;
        console.log(`Sending notification to user ${userId}: ${message}`);
        io.to(room).emit("newNotification", { 
          message, 
          ...data,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.error("sendNotification error", e);
      }
    });

    socket.on("sendComment", ({ taskId, comment, projectId }) => {
      try {
        if (!projectId) return;
        const room = `project_${projectId}`;
        console.log(`Sending comment to project ${projectId} for task ${taskId}`);
        io.to(room).emit("receiveComment", { taskId, comment });
      } catch (e) {
        console.error("sendComment error", e);
      }
    });

    socket.on("leaveProject", ({ projectId }) => {
      try {
        if (!projectId) return;
        const room = `project_${projectId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
      } catch (e) {
        console.error("leaveProject error", e);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};