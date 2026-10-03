import { describe, it, expect } from "vitest";
import configureMockStore from "redux-mock-store";
import { thunk, type ThunkDispatch } from "redux-thunk";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { type Action } from "redux";

import { deletePremise } from "../src/Redux/Reducers/PremiseReducer/premiseActions";
import { PremiseActionTypes } from "../src/Redux/Reducers/PremiseReducer/premiseTypes";

const middlewares = [thunk];
const mockStore = configureMockStore<
  object,
  ThunkDispatch<object, object, Action>
>(middlewares);

describe("deletePremise action", () => {
  it("creates DELETE_PREMISE_SUCCESS when deleting a premise is successful", async () => {
    const mockAxios = new MockAdapter(axios);
    const premiseId = "65781b9e564772aec621d74f"; // Example premise ID

    mockAxios
      .onDelete(`/api/premise/${premiseId}`)
      .reply(200);

    const expectedActions = [
      { type: PremiseActionTypes.DELETE_PREMISE_BEGINS },
      { type: PremiseActionTypes.DELETE_PREMISE_SUCCESS },
    ];

    const store = mockStore({});
    await store.dispatch(deletePremise(premiseId));
    expect(store.getActions()).toEqual(expectedActions);
  });
});
