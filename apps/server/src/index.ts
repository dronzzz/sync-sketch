import express, { Express } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import roomRoutes from "./routes/room";

const app: Express = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.json({ message: "Backend online" });
});

app.use(authRoutes);
app.use(roomRoutes);

app.listen(3002, () => {
    console.log("Server running on port 3002");
});

export default app;
