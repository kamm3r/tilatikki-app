import { type Request, type Response } from "express";
import mongoose from "mongoose";
import asyncHandler from "../middleware/asyncErrorHandler.js";
import Premise from "../models/Premise.js";
import { createPremiseAggregationPipeline } from "../middleware/advancedResults.js";

// Desc: Get all availabilities
// @route GET /api/premise
// @access Public
export const getPremise = asyncHandler( async(_req: Request, res: Response) => {
  const premises = await Premise.find({}).populate({
    path: "buildings", select: "name floors rooms location space",
    populate: { path: "space", select: "name floor area building premise" },
  });
    if(!premises) res.status(404).json({ success: false, msg: "No Premise found" });

  res.status(200).json({ success: true, premises });
  }
)



// Desc: Get single Premise
// @route GET /api/premise/:id
// @access Public

export const getSinglePremise = async (req: Request, res: Response) => {
  try {
    const premiseId = String(req.params.id);
    
    // Ensure correct extraction and conversion of query parameters
    const buildingId = req.query.building ? new mongoose.Types.ObjectId(req.query.building as string) : undefined;
    const floor = req.query.floor ? parseInt(req.query.floor as string, 10) : undefined;
    const reservedParam = req.query.reservedParam ? req.query.reservedParam as string : undefined;

    // Create an aggregation pipeline with the provided filters
    const pipeline = createPremiseAggregationPipeline({ buildingId, floor, reservedParam });

    // Add the match for premise ID at the start of the pipeline
    pipeline.unshift({ $match: { _id: new mongoose.Types.ObjectId(premiseId) } });

    const result = await Premise.aggregate(pipeline);

    if (result.length === 0) {
      return res.status(404).json({ success: false, msg: "No Premise found" });
    }

    const responseData = {
      success: true,
      premise: result[0],
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching single premise:', error);
    res.status(500).send({ success: false, message: 'Server error occurred while querying the premise.' });
  }
};

// Desc: Create new Premise
// @route POST /api/premise
// @access Private
export const createPremise = asyncHandler(async(req: Request, res: Response) => {
  const { buildings, name, address } = req.body

  // check if premise already exists
  const premiseExists = await Premise.findOne({ name });
  if (premiseExists) return res.status(400).json({ success: false, msg: "Premise already exists" });

  // check if all fields that are nessessary are filled
  if (name) return res.status(400).json({ success: false, msg: "Name is required" });
  if (address) return res.status(400).json({ success: false, msg: "Address is required" });
  if (buildings) return res.status(400).json({ success: false, msg: "Buildings are required" });

  // Check if each building has floors
  if (buildings && Array.isArray(buildings)) {
    for (const building of buildings) {
      if (!building.floors || !Array.isArray(building.floors) || building.floors.length === 0) {
        return res.status(400).json({ success: false, msg: "Each building must have at least one floor" });
      }
    }
  } else {
    return res.status(400).json({ success: false, msg: "Buildings are required and must be an array" });
  }

  // create premise
  const premise = new Premise(req.body)


  // save premise
  const savedPremise = await premise.save();

  // return saved premise
  res.status(201).json({ success: true, premise: savedPremise ,msg: `Create Premise ${savedPremise.name}` });

  }

);

// Desc: Update Premise
// @route PUT /api/premise/:id
// @access Private
export const updatePremise = asyncHandler(async(req: Request, res: Response) => {
  const premise = await Premise.findByIdAndUpdate(req.params.id,req.body,{ new: true } )
    
        if (!premise) return res.status(404).json({ success: false, msg: "No Premise found" });

      
  res.status(200).json({ success: true, msg: `Update Premise ${req.params.id}`, premise });

  }

);

// Desc: Delete Premise
// @route DELETE /api/premise/:id
// @access Private
export const deletePremise = asyncHandler(async(req: Request, res: Response) => {
  const premise = await Premise.findByIdAndDelete(req.params.id);
  
      if (!premise) return res.status(404).json({ success: false, msg: "No Premise found" });

  res.status(200).json({ success: true, msg: `Delete Premise ${req.params.id}` });

  }

);
