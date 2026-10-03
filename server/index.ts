import express, { type Request, type Response } from "express";
import cors from "cors";
import path from "node:path";
import cookieParser from "cookie-parser";
import {
  requestLogger,
  unknownEndpoint,
  errorHandler,
} from "./utils/middleware.js";
import * as config from "./utils/config.js";

// Import routes
import availabilityRoutes from "./routes/availabilityRoutes.js";
import premiseRoutes from "./routes/premiseRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import spaceRoutes from "./routes/spaceRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import buildingRoutes from "./routes/buildingRoutes.js";
import auth from "./routes/authRoutes.js";
import group from "./routes/groupRoutes.js";

// Import utils
import logger from "./utils/logger.js";
import { connectDb } from "./utils/connectDB.js";

const app = express();

app.use(cookieParser());

// Cors is required during development to allow the frontend access to
// the backend. In production, the frontend and backend are served from
// the same domain so cors is not needed. Unless other website frontends
// on different domains need to use the API.
if (config.node_env === "development") app.use(cors());

// Middlewares that need to be applied before adding routes.
app.use(express.json());
app.use(express.static(path.join(import.meta.dirname, "../client/dist/")));
app.use(requestLogger);

// Middlewares that need to be applied after adding routes.
app.use("/api/auth", auth);
app.use("/api/availability", availabilityRoutes);
app.use("/api/premise", premiseRoutes);
app.use("/api/reservation", reservationRoutes);
app.use("/api/space", spaceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/building", buildingRoutes);
app.use("/api/group", group);

app.use("/api/{*splat}", unknownEndpoint);
app.use(errorHandler);

// Paths that are not part of the API are handled by the frontend.
app.get("/{*splat}", (_req: Request, res: Response) => {
  res.sendFile(path.join(import.meta.dirname, "../client/dist/index.html"));
});

app.listen(config.port, async () => {
  logger.info(`users-server running on port: ${config.port}`);
  await connectDb();
});

export default app;
