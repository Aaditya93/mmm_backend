import { Router } from "express";
import { createPackage } from "../controllers/package.controller.js";
const router = Router();
router.post("/create-package", createPackage);
export default router;
