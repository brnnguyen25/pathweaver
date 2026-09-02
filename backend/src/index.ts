import express from "express";
import cors from "cors";
import nodesRoutes from "./routes/nodesRoutes";
import edgesRoutes from "./routes/edgesRoutes";
import validationRoutes from "./routes/validationRoutes";
import exportRoutes from "./routes/exportRoutes";
import authRoutes from "./routes/authRoutes";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/nodes", nodesRoutes);
app.use("/api/edges", edgesRoutes);
app.use("/api/validate", validationRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Pathweaver backend running on http://localhost:${PORT}`);
});
