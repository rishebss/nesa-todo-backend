import "dotenv/config";
import express from "express";
import todoRoutes from "./routes/todoRoutes.js";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

// ========== SIMPLE CORS SETUP ==========
// This is usually sufficient for development
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Added OPTIONS here
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ========== REST OF YOUR SERVER CODE ==========
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "✅ Nesa Todo API is running",
    version: "1.0.0",
    endpoints: {
      todos: {
        create: "POST /api/todos",
        getAll: "GET /api/todos",
        getStats: "GET /api/todos/stats",
        getOne: "GET /api/todos/:id",
        update: "PUT /api/todos/:id",
        delete: "DELETE /api/todos/:id"
      }
    }
  });
});

app.use("/api/todos", todoRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📝 Todo API available at http://localhost:${port}/api/todos`);
  console.log(`🌐 CORS enabled for development`);
});