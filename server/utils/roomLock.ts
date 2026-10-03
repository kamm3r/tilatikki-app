import mongoose from "mongoose";
import Space from "../models/Space.js";
import logger from "./logger.js";

const leaseMs = 30_000;
const waitMs = 5_000;

export async function acquireRoomLock(spaceId: mongoose.Types.ObjectId) {
  const owner = new mongoose.Types.ObjectId();
  const deadline = Date.now() + waitMs;

  do {
    const claimed = await Space.findOneAndUpdate(
      {
        _id: spaceId,
        $or: [
          { reservationLockUntil: { $exists: false } },
          { reservationLockUntil: { $lte: new Date() } },
        ],
      },
      { $set: { reservationLockOwner: owner, reservationLockUntil: new Date(Date.now() + leaseMs) } },
      { projection: { _id: 1 }, returnDocument: "after" },
    );

    if (claimed) {
      const heartbeat = setInterval(() => {
        void Space.updateOne(
          { _id: spaceId, reservationLockOwner: owner },
          { $set: { reservationLockUntil: new Date(Date.now() + leaseMs) } },
        ).catch((error: unknown) => logger.error(error));
      }, leaseMs / 3);
      heartbeat.unref();

      return async () => {
        clearInterval(heartbeat);
        try {
          await Space.updateOne(
            { _id: spaceId, reservationLockOwner: owner },
            { $unset: { reservationLockOwner: "", reservationLockUntil: "" } },
          );
        } catch (error) {
          logger.error(error);
        }
      };
    }

    if (Date.now() >= deadline) return null;
    await new Promise((resolve) => setTimeout(resolve, 40));
  } while (true);
}
