import { type Request, type Response } from "express";
import mongoose from "mongoose";
import Availability from "../models/Availability.js";
import Reservation from "../models/Reservation.js";
import Premise from "../models/Premise.js";
import Space from "../models/Space.js";
import User from "../models/User.js";
import { acquireRoomLock } from "../utils/roomLock.js";
import asyncErrorHandler from "../middleware/asyncErrorHandler.js";

function parseInterval(startValue: unknown, endValue: unknown) {
  const start = new Date(String(startValue ?? ""));
  const end = new Date(String(endValue ?? ""));
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) return null;
  return { start, end };
}

async function canManage(premiseId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
  const premise = await Premise.findById(premiseId);
  return premise?.users.some((id) => String(id) === String(userId)) ?? false;
}

export const getAvailabilitiesForSpace = asyncErrorHandler(async (req: Request, res: Response) => {
  const spaceId = String(req.params.spaceId);
  if (!mongoose.isValidObjectId(spaceId)) return res.status(400).json({ error: "Invalid space ID." });
  const space = await Space.findById(spaceId);
  if (!space) return res.status(404).json({ error: "Space not found." });
  const availabilities = await Availability.find({ space: space._id })
    .sort({ startdate: 1 }).populate("reservations");
  res.status(200).json(availabilities);
});

export const getAvailabilitiesWithPremiseId = asyncErrorHandler(async (req: Request, res: Response) => {
  const premiseId = String(req.params.id);
  const interval = parseInterval(req.body.startdate, req.body.enddate);
  if (!mongoose.isValidObjectId(premiseId) || !interval) {
    return res.status(400).json({ error: "Choose a premise and a valid start and end time." });
  }
  const availabilities = await Availability.find({
    premise: premiseId,
    startdate: { $lt: interval.end },
    enddate: { $gt: interval.start },
  }).populate("reservations");
  res.status(200).json(availabilities);
});

export const getAvailability = asyncErrorHandler(async (req: Request, res: Response) => {
  if (req.params.id) {
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid availability ID." });
    const availability = await Availability.findById(id).populate("reservations");
    if (!availability) return res.status(404).json({ error: "Availability not found." });
    return res.status(200).json(availability);
  }
  const availabilities = await Availability.find().sort({ startdate: 1 });
  res.status(200).json({ success: true, availabilities });
});

export const createAvailability = asyncErrorHandler(async (req: Request, res: Response) => {
  const interval = parseInterval(req.body.startdate, req.body.enddate);
  if (!interval || !mongoose.isValidObjectId(req.body.spaceId)) {
    return res.status(400).json({ error: "Choose a room and a valid start and end time." });
  }
  const space = await Space.findById(req.body.spaceId);
  if (!space) return res.status(404).json({ error: "Space not found." });
  if (!await canManage(space.premise, req.user._id)) {
    return res.status(403).json({ error: "You cannot manage availability for this premise." });
  }
  const release = await acquireRoomLock(space._id);
  if (!release) return res.status(503).json({ error: "This room is busy. Try again shortly." });
  try {
    const overlap = await Availability.exists({
      space: space._id,
      startdate: { $lt: interval.end },
      enddate: { $gt: interval.start },
    });
    if (overlap) return res.status(409).json({ error: "Availability already exists at that time." });
    const availability = await Availability.create({
      creator: req.user._id, startdate: interval.start, enddate: interval.end,
      space: space._id, premise: space.premise,
    });
    await Promise.all([
      Space.updateOne({ _id: space._id }, { $addToSet: { availabilities: availability._id } }),
      User.updateOne({ _id: req.user._id }, { $addToSet: { availabilities: availability._id } }),
    ]);
    return res.status(201).json(availability);
  } finally {
    await release();
  }
});

export const updateAvailability = asyncErrorHandler(async (req: Request, res: Response) => {
  const availability = await Availability.findById(req.params.id);
  if (!availability) return res.status(404).json({ error: "Availability not found." });
  if (!await canManage(availability.premise, req.user._id)) {
    return res.status(403).json({ error: "You cannot manage availability for this premise." });
  }
  const release = await acquireRoomLock(availability.space);
  if (!release) return res.status(503).json({ error: "This room is busy. Try again shortly." });
  try {
    const current = await Availability.findById(availability._id);
    if (!current) return res.status(404).json({ error: "Availability not found." });
    const interval = parseInterval(req.body.startdate ?? current.startdate, req.body.enddate ?? current.enddate);
    if (!interval) return res.status(400).json({ error: "Choose a valid start and end time." });
    const overlap = await Availability.exists({
      _id: { $ne: current._id }, space: current.space,
      startdate: { $lt: interval.end }, enddate: { $gt: interval.start },
    });
    if (overlap) return res.status(409).json({ error: "Availability already exists at that time." });
    const outsideReservation = await Reservation.exists({ availability: current._id,
      $or: [{ startdate: { $lt: interval.start } }, { enddate: { $gt: interval.end } }],
    });
    if (outsideReservation) return res.status(409).json({ error: "Existing reservations fall outside that time." });
    current.startdate = interval.start;
    current.enddate = interval.end;
    await current.save();
    return res.status(200).json(current);
  } finally {
    await release();
  }
});

export const deleteAvailability = asyncErrorHandler(async (req: Request, res: Response) => {
  const availability = await Availability.findById(req.params.id);
  if (!availability) return res.status(404).json({ error: "Availability not found." });
  if (!await canManage(availability.premise, req.user._id)) {
    return res.status(403).json({ error: "You cannot manage availability for this premise." });
  }
  const release = await acquireRoomLock(availability.space);
  if (!release) return res.status(503).json({ error: "This room is busy. Try again shortly." });
  try {
    const current = await Availability.findById(availability._id);
    if (!current) return res.status(404).json({ error: "Availability not found." });
    if (await Reservation.exists({ availability: current._id })) {
      return res.status(409).json({ error: "Cancel its reservations before removing this availability." });
    }
    await Availability.deleteOne({ _id: current._id });
    await Promise.all([
      Space.updateOne({ _id: current.space }, { $pull: { availabilities: current._id } }),
      User.updateOne({ _id: current.creator }, { $pull: { availabilities: current._id } }),
    ]);
    return res.status(204).send();
  } finally {
    await release();
  }
});
