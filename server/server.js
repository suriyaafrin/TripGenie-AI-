import "dotenv/config";
import express from "express";
import cors from "cors";
import tourRoutes from "./routes/tourRoutes.js";
import { DEFAULT_PORT } from "./config.js";

const app = express();
const port = process.env.PORT || DEFAULT_PORT;

// Only allow the configured frontend origin to call this API.
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "TripGenie API" });
});

app.use("/api", tourRoutes);

// Handle malformed JSON and unexpected errors in one place.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ error: "Invalid request data" });
});

app.listen(port, () => {
  console.log(`TripGenie server running at http://localhost:${port}`);
});
