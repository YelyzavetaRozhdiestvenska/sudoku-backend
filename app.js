import express, { json } from "express";
import logger from "morgan";
import cors from "cors";
import "dotenv/config";
import contactsRouter from "./routes/contactsRouter.js";
import userRouter from "./routes/auth.js";

const app = express();
const formatLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatLogger));
app.use(cors());
app.use(json());
app.use(express.static("public"));

app.use("/api/contacts", contactsRouter);
app.use("/api/users", userRouter);

app.use((_, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;
  res.status(status).json({ message });
});

export default app;
