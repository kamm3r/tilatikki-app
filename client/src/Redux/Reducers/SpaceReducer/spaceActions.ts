import { Dispatch } from "redux";
import { SpaceActionTypes } from "./spaceTypes";

// Base URL for your API
const API_BASE_URL = "/api";

// Action for getting all premises
export function getAllSpaces() {
  return async function (dispatch: Dispatch) {
    dispatch({ type: SpaceActionTypes.GET_SPACES_BEGINS });
    try {
      const response = await fetch(`${API_BASE_URL}/space`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      dispatch({
        type: SpaceActionTypes.GET_SPACES_SUCCESS,
        payload: await response.json(),
      });
    } catch (error) {
      dispatch({
        type: SpaceActionTypes.GET_SPACES_FAILURE,
        payload: error as Error,
      });
    }
  };
}

export function getSpaceById(id: string) {
  return async function (dispatch: Dispatch) {
    dispatch({ type: SpaceActionTypes.GET_SPACE_BEGINS });
    try {
      const response = await fetch(`${API_BASE_URL}/space/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      dispatch({
        type: SpaceActionTypes.GET_SPACE_SUCCESS,
        payload: await response.json(),
      });
    } catch (error) {
      dispatch({
        type: SpaceActionTypes.GET_SPACE_FAILURE,
        payload: error as Error,
      });
    }
  };
}
