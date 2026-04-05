import cors from "cors";
import express from "express";
import sessionsRouter from "./routes/sessions";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api/sessions", sessionsRouter);

app.listen(PORT, () => {
  console.log(`Vi-Notes API listening on http://localhost:${PORT}`);
});
