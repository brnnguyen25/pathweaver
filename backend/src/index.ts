import express from "express";
import cors from "cors";
import nodesRoutes from "./routes/nodesRoutes";
import edgesRoutes from "./routes/edgesRoutes";
import validationRoutes from "./routes/validationRoutes";
import exportRoutes from "./routes/exportRoutes";
import authRoutes from "./routes/authRoutes";
import questlinesRoutes from "./routes/questlinesRoutes";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/questlines/:questlineId/nodes", nodesRoutes);
app.use("/api/questlines/:questlineId/edges", edgesRoutes);
app.use("/api/questlines/:questlineId/validate", validationRoutes);
app.use("/api/questlines/:questlineId/export", exportRoutes);
app.use("/api/questlines", questlinesRoutes);

app.listen(PORT, () => {
  console.log(`Pathweaver backend running on http://localhost:${PORT}`);
});
