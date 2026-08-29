import express from "express";
import nodesRoutes from "./routes/nodesRoutes";
import cors from "cors";
import edgesRoutes from "./routes/edgesRoutes";

const app = express();
app.use(cors());
app.use("/api/edges", edgesRoutes);

const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/nodes", nodesRoutes);

app.listen(PORT, () => {
  console.log(`Pathweaver backend running on http://localhost:${PORT}`);
});
