import { describe, it, expect } from "vitest";
import configureMockStore from "redux-mock-store";
import { thunk, type ThunkDispatch } from "redux-thunk";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { type Action } from "redux";
import { updatePremise } from "../src/Redux/Reducers/PremiseReducer/premiseActions";
import { PremiseActionTypes } from "../src/Redux/Reducers/PremiseReducer/premiseTypes";

const middlewares = [thunk];
const mockStore = configureMockStore<
  object,
  ThunkDispatch<object, object, Action>
>(middlewares);

describe("updatePremise action", () => {
  it("creates UPDATE_PREMISE_SUCCESS when updating a premise is successful", async () => {
    const mockAxios = new MockAdapter(axios);
    const premiseData = {
      name: "Test Premise",
      address: "Test Address updated",
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
    const premiseId = "65781b9e564772aec621d74f"; // Example premise ID
    const mockResponse = { response: "Premise updated successfully" };

    mockAxios
      .onPut(`/api/premise/${premiseId}`)
      .reply(200, mockResponse);

    const expectedActions = [
      { type: PremiseActionTypes.UPDATE_PREMISE_BEGINS },
      {
        type: PremiseActionTypes.UPDATE_PREMISE_SUCCESS,
        payload: mockResponse,
      },
    ];

    const store = mockStore({});
    await store.dispatch(updatePremise(premiseId, premiseData));
    expect(store.getActions()).toEqual(expectedActions);
  });
});
