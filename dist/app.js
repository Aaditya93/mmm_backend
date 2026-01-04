import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";
const app = express();
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://api.makemypackages.com",
        "https://main.d3cl9zxj5czhv3.amplifyapp.com",
        "https://makemypackages.com",
        "https://www.makemypackages.com",
    ],
    credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Routes
app.use("/", routes);
// Error handling
app.use(errorHandler);
export default app;
