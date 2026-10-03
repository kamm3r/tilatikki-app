import { type Request, type Response } from "express";
import mongoose from "mongoose";
import Availability from "../models/Availability.js";
import Reservation from "../models/Reservation.js";
import Premise from "../models/Premise.js";
import Space from "../models/Space.js";
import User from "../models/User.js";
import { duringTimespan } from "../utils/dateFunctions.js";
import { acquireRoomLock } from "../utils/roomLock.js";
import asyncErrorHandler from "../middleware/asyncErrorHandler.js";

function parseInterval(body: Record<string, unknown>) {
  const start = new Date(String(body.startdate ?? ""));
  const end = new Date(String(body.enddate ?? ""));
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) {
    return null;
  }
  return { start, end };
}

async function canReserve(premiseId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
  const premise = await Premise.findById(premiseId);
  return premise?.users.some((id) => String(id) === String(userId)) ?? false;
}

export const getReservation = asyncErrorHandler(async (req: Request, res: Response) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return res.status(404).json({ error: "Reservation not found" });
  if (String(reservation.creator) !== String(req.user._id)) {
    return res.status(403).json({ error: "You cannot view this reservation." });
  }
  res.status(200).json(reservation);
});

export const getAllReservations = asyncErrorHandler(async (req: Request, res: Response) => {
  const reservations = await Reservation.find({ creator: req.user._id });
  res.status(200).json(reservations);
});

export const createReservation = asyncErrorHandler(async (req: Request, res: Response) => {
  const interval = parseInterval(req.body);
  if (!interval) return res.status(400).json({ error: "Choose a valid start and end time." });
  if (!mongoose.isValidObjectId(req.body.availabilityId)) {
    return res.status(400).json({ error: "Choose an availability." });
  }

  const availability = await Availability.findById(req.body.availabilityId);
  if (!availability) return res.status(404).json({ error: "Availability not found." });
  if (!duringTimespan(interval.start, interval.end, availability)) {
    return res.status(400).json({ error: "The selected time is outside this room's availability." });
  }
  if (!await canReserve(availability.premise as mongoose.Types.ObjectId, req.user._id)) {
    return res.status(403).json({ error: "You cannot reserve rooms in this premise." });
  }

  const release = await acquireRoomLock(availability.space as mongoose.Types.ObjectId);
  if (!release) return res.status(503).json({ error: "This room is busy. Try again shortly." });
  try {
    const currentAvailability = await Availability.findById(availability._id);
    if (!currentAvailability) return res.status(404).json({ error: "Availability not found." });
    if (!duringTimespan(interval.start, interval.end, currentAvailability)) {
      return res.status(400).json({ error: "The selected time is outside this room's availability." });
    }
    const overlap = await Reservation.exists({
      space: currentAvailability.space,
      startdate: { $lt: interval.end },
      enddate: { $gt: interval.start },
    });
    if (overlap) return res.status(409).json({ error: "This room is already reserved at that time." });

    const reservation = await Reservation.create({
      startdate: interval.start,
      enddate: interval.end,
      availability: currentAvailability._id,
      premise: currentAvailability.premise,
      space: currentAvailability.space,
      creator: req.user._id,
    });
    await Promise.all([
      Availability.updateOne({ _id: currentAvailability._id }, { $addToSet: { reservations: reservation._id } }),
      Space.updateOne({ _id: currentAvailability.space }, { $addToSet: { reservations: reservation._id } }),
      User.updateOne({ _id: req.user._id }, { $addToSet: { reservations: reservation._id } }),
    ]);
    return res.status(201).json(reservation);
  } finally {
    await release();
  }
});

export const updateReservation = asyncErrorHandler(async (req: Request, res: Response) => {
  const interval = parseInterval(req.body);
  if (!interval) return res.status(400).json({ error: "Choose a valid start and end time." });
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return res.status(404).json({ error: "Reservation not found." });
  if (String(reservation.creator) !== String(req.user._id)) {
    return res.status(403).json({ error: "You cannot change this reservation." });
  }
  const availability = await Availability.findById(reservation.availability);
  if (!availability || !duringTimespan(interval.start, interval.end, availability)) {
    return res.status(400).json({ error: "The selected time is outside this room's availability." });
  }
  const release = await acquireRoomLock(reservation.space as mongoose.Types.ObjectId);
  if (!release) return res.status(503).json({ error: "This room is busy. Try again shortly." });
  try {
    const current = await Reservation.findById(reservation._id);
    if (!current) return res.status(404).json({ error: "Reservation not found." });
    const currentAvailability = await Availability.findById(current.availability);
    if (!currentAvailability || !duringTimespan(interval.start, interval.end, currentAvailability)) {
      return res.status(400).json({ error: "The selected time is outside this room's availability." });
    }
    const overlap = await Reservation.exists({
      _id: { $ne: current._id },
      space: current.space,
      startdate: { $lt: interval.end },
      enddate: { $gt: interval.start },
    });
    if (overlap) return res.status(409).json({ error: "This room is already reserved at that time." });
    current.startdate = interval.start;
    current.enddate = interval.end;
    await current.save();
    return res.status(200).json(current);
  } finally {
    await release();
  }
});

export const deleteReservation = asyncErrorHandler(async (req: Request, res: Response) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return res.status(404).json({ error: "Reservation not found." });
  if (String(reservation.creator) !== String(req.user._id)) {
    return res.status(403).json({ error: "You cannot cancel this reservation." });
  }
  const release = await acquireRoomLock(reservation.space as mongoose.Types.ObjectId);
  if (!release) return res.status(503).json({ error: "This room is busy. Try again shortly." });
  try {
    const current = await Reservation.findById(reservation._id);
    if (!current) return res.status(404).json({ error: "Reservation not found." });
    await Reservation.deleteOne({ _id: current._id });
    await Promise.all([
      Availability.updateOne({ _id: current.availability }, { $pull: { reservations: current._id } }),
      Space.updateOne({ _id: current.space }, { $pull: { reservations: current._id } }),
      User.updateOne({ _id: req.user._id }, { $pull: { reservations: current._id } }),
    ]);
    return res.status(204).send();
  } finally {
    await release();
  }
});
