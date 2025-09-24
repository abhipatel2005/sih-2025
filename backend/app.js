import express from "express";
import studentRoutes from "./routes/studentRoutes.js";
import filterRoutes from "./routes/filterRoutes.js";
import schoolRoutes from "./routes/schoolRoutes.js";

const app = express();
app.use(express.json());

// Routes
app.use("/api/students", studentRoutes);
app.use("/api/filter", filterRoutes);
app.use("/api/schools", schoolRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
