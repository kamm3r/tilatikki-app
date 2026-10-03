import express from "express";
import { updateBuilding, getSingleBuilding } from "../controllers/buildingControllers.js";


const router = express.Router();

//router.use(protect)

router.route("/:id").put(updateBuilding).get(getSingleBuilding)

export default router;
