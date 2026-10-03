import express from "express";
import {
  getAvailability, createAvailability, updateAvailability, deleteAvailability,
  getAvailabilitiesWithPremiseId, getAvailabilitiesForSpace,
} from "../controllers/availabilityControllers.js";
import { authorize, protect } from "../utils/middleware.js";

const router = express.Router();
router.get("/", getAvailability);
router.get("/space/:spaceId", getAvailabilitiesForSpace);
router.post("/premise/:id", getAvailabilitiesWithPremiseId);
router.get("/:id", getAvailability);
router.post("/", protect, authorize("user", "admin"), createAvailability);
router.put("/:id", protect, authorize("user", "admin"), updateAvailability);
router.delete("/:id", protect, authorize("user", "admin"), deleteAvailability);
export default router;
