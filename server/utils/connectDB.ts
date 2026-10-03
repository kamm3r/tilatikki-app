import mongoose from "mongoose";
import logger from "./logger.js";
import {mongoUri} from "./config.js";

export async function connectDb() {
  try {
    // Keep trying to connect as long as the app is disconnected from mongoDB
    await mongoose.connect(mongoUri);
    logger.info(`Connected to DB, ${mongoUri}`);
  } catch {
    process.exit(1);
  }
}
