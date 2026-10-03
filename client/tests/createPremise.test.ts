import { describe, it, expect } from "vitest";
import configureMockStore from "redux-mock-store";
import { thunk, type ThunkDispatch } from "redux-thunk";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { type Action } from "redux";

import { createPremise } from "../src/Redux/Reducers/PremiseReducer/premiseActions"; // Adjust the import path as needed
import { PremiseActionTypes } from "../src/Redux/Reducers/PremiseReducer/premiseTypes"; // Adjust the import path as needed

const middlewares = [thunk];
const mockStore = configureMockStore<
  object,
  ThunkDispatch<object, object, Action>
>(middlewares);

describe("createPremise action", () => {
  it("creates CREATE_PREMISE_SUCCESS when creating premise has been done", async () => {
    const mockAxios = new MockAdapter(axios);
    const premiseData = {
      name: "Test Premise",
      address: "Test Address",
      users: ["User1", "User2"],
      spaces: ["Space1", "Space2"],
      buildings: [
        {
          name: "Test Building",
          floors: [
            {
              floor: 1,
              blueprint_url: "https://test.com/blueprint.png",
            },
          ],
        },
      ],
    };
    const mockResponse = { response: "Premise created successfully" };

    mockAxios
      .onPost("/api/premise")
      .reply(200, mockResponse);

    const expectedActions = [
      { type: PremiseActionTypes.CREATE_PREMISE_BEGINS },
      {
        type: PremiseActionTypes.CREATE_PREMISE_SUCCESS,
        payload: mockResponse,
      },
    ];

    const store = mockStore({});
    await store.dispatch(createPremise(premiseData));
    expect(store.getActions()).toEqual(expectedActions);
  });
});
