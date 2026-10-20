

import "dotenv/config";

import express from "express";
import cors from "cors";
import db from "./db/db.config.js";
import mainRouter from "./src/api/main.routes.js";
import { errorhandler } from "./src/middleware/error-handler.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://chatgpts.merihunmekango.com",
    ],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api", mainRouter);

app.use("/test", (req, res) => {
  res.send("Server is running");
});

app.use(errorhandler);

async function startServer() {
  try {
    // Check database connection
    const connection = await db.getConnection();

    console.log("✅ Database connected successfully!");

    connection.release();

    // Start Express server
    app.listen(3888, (err) => {
      if (err) {
        console.error("❌ Error starting server:", err.message);
        return;
      }

      console.log("🚀 Server is running on http://localhost:3888");
    });
  } catch (err) {
    console.error("❌ Database is not connected!");
    console.error("Database error:", err.message);
  }
}

startServer();
