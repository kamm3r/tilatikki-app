import express from "express";
import {
  getAllSpace, createSpace, updateSpaceById, deleteSpaceById, getSpaceById,
} from "../controllers/spaceControllers.js";
import { authorize, protect } from "../utils/middleware.js";

const router = express.Router();
router.get("/", getAllSpace);
router.get("/:id", getSpaceById);
router.post("/", protect, authorize("user", "admin"), createSpace);
router.put("/:id", protect, authorize("user", "admin"), updateSpaceById);
router.delete("/:id", protect, authorize("user", "admin"), deleteSpaceById);
export default router;
