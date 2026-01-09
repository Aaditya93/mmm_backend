import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://api.makemypackages.com",
      "https://www.makemypackages.com",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/", routes);

app.use(errorHandler);

export default app;
