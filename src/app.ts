import express from "express";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "forgehub-api",
    status: "healthy"
  });
});

export default app;
