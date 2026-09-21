import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "forgehub-api",
    status: "healthy"
  });
});

app.use("/api/v1/auth", authRoutes);

export default app;
