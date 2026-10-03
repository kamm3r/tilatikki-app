import { Dispatch } from "redux";
import axios from "axios";
import { ActionTypes, type ActionType } from "./userTypes";
import Cookies from "universal-cookie";

// Define the User interface TODO: Fix any types
export interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  premises: any[];
  role: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availabilities: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reservations: any[];
  createdAt: string;
  updatedAt: string;
}

// Define the action interface for user-related actions
interface UserAction<Type, Payload> {
  type: Type;
  payload?: Payload;
}

// Define credentials interface
interface RegisterUser {
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
}

// Base URL for your API
const API_BASE_URL = "/api";

const cookies = new Cookies();

// Save the token as a cookie.

const getToken = () => cookies.get("tilatikkiToken");

export const config = () => {
  return {
    headers: { Authorization: `Bearer ${getToken()}` },
  };
};

// Define the action creator for fetching all users
export const getAllUsers = () => {
  return async (dispatch: Dispatch<UserAction<ActionType, User[] | Error>>) => {
    dispatch({ type: ActionTypes.GET_ALL_USERS_BEGINS });
    try {
      // Make an API call to fetch all user data from your backend
      const response = await axios.get(`${API_BASE_URL}/users`, config());

      const userData = response.data;
      dispatch({
        type: ActionTypes.GET_ALL_USERS_SUCCESS,
        payload: userData,
      });
    } catch (error) {
      dispatch({
        type: ActionTypes.GET_ALL_USERS_FAILURE,
        payload: error as Error,
      });
    }
  };
};
export function getUserById(id: string) {
  return async function (dispatch: Dispatch) {
    dispatch({ type: ActionTypes.GET_USER_BY_ID_BEGINS });
    try {
      // Make an API call to fetch all user data from your backend
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();
      console.log(data);
      dispatch({
        type: ActionTypes.GET_USER_BY_ID_SUCCESS,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: ActionTypes.GET_USER_BY_ID_FAILURE,
        payload: error as Error,
      });
    }
  };
}

export function loginUser(credentials: { email: string; password: string }) {
  return async (dispatch: Dispatch<UserAction<ActionType, User[] | Error>>) => {
    dispatch({ type: ActionTypes.LOGIN_USER_BEGINS });
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        credentials,
      );
      const userData = response.data;
      cookies.set("tilatikkiToken", userData.token, {
        // Cookie expires in 3 days.
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
        path: "/",
      });

      dispatch({
        type: ActionTypes.LOGIN_USER_SUCCESS,
        payload: userData,
      });

      return true;
    } catch (error) {
      dispatch({
        type: ActionTypes.LOGIN_USER_FAILURE,
        payload: error as Error,
      });
      return false;
    }
  };
}

export function logoutUser() {
  return async (dispatch: Dispatch<UserAction<ActionType, User[] | Error>>) => {
    dispatch({ type: ActionTypes.LOGOUT_USER_BEGINS });
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/logout`, config());
      const userData = response.data;
      cookies.remove("tilatikkiToken");
      dispatch({
        type: ActionTypes.LOGOUT_USER_SUCCESS,
        payload: userData,
      });

      // After successful logout, call getMe
    } catch (error) {
      dispatch({
        type: ActionTypes.LOGOUT_USER_FAILURE,
        payload: error as Error,
      });
    }
  };
}

export function getMe() {
  return async (dispatch: Dispatch<UserAction<ActionType, User[] | Error>>) => {
    dispatch({ type: ActionTypes.GET_ME_BEGINS });
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, config());
      const userData = response.data;
      dispatch({
        type: ActionTypes.GET_ME_SUCCESS,
        payload: userData,
      });

      return userData;
    } catch (error) {
      dispatch({
        type: ActionTypes.GET_ME_FAILURE,
        payload: error as Error,
      });
    }
  };
}

export function registerUser(credentials: RegisterUser) {
  return async (
    dispatch: Dispatch<UserAction<ActionType, User[] | string>>,
  ) => {
    dispatch({ type: ActionTypes.CREATE_USER_BEGINS });
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/register`,
        credentials,
      );
      const userData = response.data;
      dispatch({
        type: ActionTypes.CREATE_USER_SUCCESS,
        payload: userData,
      });
    } catch (error) {
      dispatch({
        type: ActionTypes.CREATE_USER_FAILURE,
        payload: (error as Error).message,
      });
    }
  };
}
