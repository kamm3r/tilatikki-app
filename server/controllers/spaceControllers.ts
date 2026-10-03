import { type Request, type Response } from "express";
import mongoose from "mongoose";
import Space from "../models/Space.js";
import Building from "../models/Building.js";
import Premise from "../models/Premise.js";
import Availability from "../models/Availability.js";
import Reservation from "../models/Reservation.js";
import asyncErrorHandler from "../middleware/asyncErrorHandler.js";

function validPolygon(value: unknown): value is { x: number; y: number }[] {
  return Array.isArray(value) && value.length >= 3 && value.every((point) =>
    point && typeof point.x === "number" && typeof point.y === "number" &&
    Number.isFinite(point.x) && Number.isFinite(point.y) &&
    point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100);
}

async function canManage(premiseId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
  const premise = await Premise.findById(premiseId);
  return premise?.users.some((id) => String(id) === String(userId)) ?? false;
}

export const getAllSpace = asyncErrorHandler(async (_req: Request, res: Response) => {
  const spaces = await Space.find();
  res.status(200).json({ success: true, data: spaces });
});

export const createSpace = asyncErrorHandler(async (req: Request, res: Response) => {
  const { name, area, floor, premiseId, buildingId, mapPolygon } = req.body;
  if (typeof name !== "string" || !name.trim() || !mongoose.isValidObjectId(premiseId) ||
    !mongoose.isValidObjectId(buildingId) || !Number.isInteger(floor) || floor < 1 ||
    (area !== undefined && (typeof area !== "number" || area <= 0)) ||
    (mapPolygon !== undefined && !validPolygon(mapPolygon))) {
    return res.status(400).json({ error: "Choose a premise, building, floor, name, and valid room outline." });
  }
  const premise = await Premise.findById(premiseId);
  const building = await Building.findById(buildingId);
  if (!premise || !building || !premise.buildings.some((id) => String(id) === String(building._id))) {
    return res.status(404).json({ error: "Building not found in this premise." });
  }
  if (floor > building.floors) return res.status(400).json({ error: "Floor is outside this building." });
  if (!await canManage(premise._id, req.user._id)) {
    return res.status(403).json({ error: "You cannot manage rooms in this premise." });
  }
  const space = await Space.create({
    name: name.trim(), area, floor, mapPolygon,
    premise: premise._id, building: building._id,
  });
  await Building.updateOne({ _id: building._id }, { $addToSet: { space: space._id } });
  res.status(201).json({ success: true, data: space });
});

export const getSpaceById = asyncErrorHandler(async (req: Request, res: Response) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid room ID." });
  const space = await Space.findById(req.params.id);
  if (!space) return res.status(404).json({ success: false, error: "Space not found" });
  res.status(200).json({ success: true, data: space });
});

export const updateSpaceById = asyncErrorHandler(async (req: Request, res: Response) => {
  const space = await Space.findById(req.params.id);
  if (!space) return res.status(404).json({ error: "Space not found." });
  if (!await canManage(space.premise, req.user._id)) {
    return res.status(403).json({ error: "You cannot manage rooms in this premise." });
  }
  const { name, area, floor, mapPolygon } = req.body;
  if ((name !== undefined && (typeof name !== "string" || !name.trim())) ||
    (area !== undefined && (typeof area !== "number" || area <= 0)) ||
    (mapPolygon !== undefined && !validPolygon(mapPolygon)) ||
    (floor !== undefined && (!Number.isInteger(floor) || floor < 1))) {
    return res.status(400).json({ error: "Invalid room details or outline." });
  }
  if (floor !== undefined) {
    const building = await Building.findById(space.building);
    if (!building || floor > building.floors) return res.status(400).json({ error: "Floor is outside this building." });
    space.floor = floor;
  }
  if (name !== undefined) space.name = name.trim();
  if (area !== undefined) space.area = area;
  if (mapPolygon !== undefined) space.mapPolygon = mapPolygon;
  await space.save();
  res.status(200).json({ success: true, data: space });
});

export const deleteSpaceById = asyncErrorHandler(async (req: Request, res: Response) => {
  const space = await Space.findById(req.params.id);
  if (!space) return res.status(404).json({ error: "Space not found." });
  if (!await canManage(space.premise, req.user._id)) {
    return res.status(403).json({ error: "You cannot manage rooms in this premise." });
  }
  if (await Availability.exists({ space: space._id }) || await Reservation.exists({ space: space._id })) {
    return res.status(409).json({ error: "Remove this room's availability and reservations first." });
  }
  await Space.deleteOne({ _id: space._id });
  await Building.updateOne({ _id: space.building }, { $pull: { space: space._id } });
  res.status(204).send();
});
