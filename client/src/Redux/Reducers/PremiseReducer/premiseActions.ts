import axios from "axios";
import { Dispatch } from "redux";
import { PremiseActionTypes } from "./premiseTypes";
import { type BuildingDetails } from "~/Redux/Reducers/premiseState";

// Define the structure for a premise
interface Premise {
  name: string;
  address: string;
  users: string[]; // Array of User ObjectIds
  spaces: string[]; // Array of Space ObjectIds
  buildings: BuildingDetails[];
}

// Base URL for your API
const API_BASE_URL = "/api";

// Action for getting all premises
export const getAllPremises = () => async (dispatch: Dispatch) => {
  dispatch({ type: PremiseActionTypes.GET_PREMISES_BEGINS });
  try {
    const response = await axios.get(`${API_BASE_URL}/premise`);
    dispatch({
      type: PremiseActionTypes.GET_PREMISES_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: PremiseActionTypes.GET_PREMISES_FAILURE,
      payload: error as Error,
    });
  }
};

export const getPremiseById =
  (id: string, buildingId?: string, floor?: number) =>
  async (dispatch: Dispatch) => {
    const prefix = buildingId ? "GET_BUILDING" : "GET_PREMISE";
    dispatch({ type: prefix + "_BEGINS" });

    try {
      let url = `${API_BASE_URL}/premise/${id}`;
      const params = new URLSearchParams();
      if (buildingId) params.append("building", buildingId);
      if (floor !== undefined) params.append("floor", floor.toString());
      if (params.toString()) url += `?${params}`;

      const response = await axios.get(url);
      dispatch({
        type: prefix + "_SUCCESS",
        payload: buildingId
          ? response.data.premise.buildings
          : response.data.premise,
      });
    } catch (error) {
      dispatch({
        type: prefix + "_FAILURE",
        payload: error as Error,
      });
    }
  };

// Action for creating a premise
export const createPremise =
  (premiseData: Premise) => async (dispatch: Dispatch) => {
    dispatch({ type: PremiseActionTypes.CREATE_PREMISE_BEGINS });
    try {
      const response = await axios.post(`${API_BASE_URL}/premise`, premiseData);
      dispatch({
        type: PremiseActionTypes.CREATE_PREMISE_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      dispatch({
        type: PremiseActionTypes.CREATE_PREMISE_FAILURE,
        payload: error as Error,
      });
    }
  };

// Action for updating a premise
export const updatePremise =
  (id: string, updatedData: Premise) => async (dispatch: Dispatch) => {
    dispatch({ type: PremiseActionTypes.UPDATE_PREMISE_BEGINS });
    try {
      const response = await axios.put(
        `${API_BASE_URL}/premise/${id}`,
        updatedData,
      );
      dispatch({
        type: PremiseActionTypes.UPDATE_PREMISE_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      dispatch({
        type: PremiseActionTypes.UPDATE_PREMISE_FAILURE,
        payload: error as Error,
      });
    }
  };

// Action for deleting a premise
export const deletePremise = (id: string) => async (dispatch: Dispatch) => {
  dispatch({ type: PremiseActionTypes.DELETE_PREMISE_BEGINS });
  try {
    await axios.delete(`${API_BASE_URL}/premise/${id}`);
    dispatch({ type: PremiseActionTypes.DELETE_PREMISE_SUCCESS });
  } catch (error) {
    dispatch({
      type: PremiseActionTypes.DELETE_PREMISE_FAILURE,
      payload: error as Error,
    });
  }
};
