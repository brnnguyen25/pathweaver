import express from "express";
import cors from "cors";
import nodesRoutes from "./routes/nodesRoutes";
import edgesRoutes from "./routes/edgesRoutes";
import validationRoutes from "./routes/validationRoutes";

const app = express();
app.use(cors());
app.use("/api/edges", edgesRoutes);
app.use("/api/validate", validationRoutes);
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/nodes", nodesRoutes);

app.listen(PORT, () => {
  console.log(`Pathweaver backend running on http://localhost:${PORT}`);
});
