const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const connectDB = require("./config/db");
const { initSocket } = require("./services/socketService");
const errorHandler = require("./middleware/errorHandler");
const swaggerDocument = require("./swagger/swaggerDoc");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }
});
initSocket(io);

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api-docs.json", (req, res) => res.json(swaggerDocument));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "BookLeaf Author Support API",
    timestamp: new Date().toISOString()
  });
});

const path = require("path");
const fs = require("fs");

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);

// Serve static frontend build if present
const clientDist = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/api-docs")) {
      return next();
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// 404 handler for unknown routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to Database & Start Server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[BookLeaf Server] Running on http://localhost:${PORT}`);
    console.log(`[API Docs] Swagger documentation available at http://localhost:${PORT}/api-docs`);
  });
});

module.exports = { app, server };
