// Import the `useDispatch` and `bindActionCreators` hooks from React Redux.
import { useDispatch } from "react-redux";
import { bindActionCreators } from "redux";
import { useMemo } from "react";

// Import the action creators from the Redux store.
import { premiseActionCreators } from "../Redux/store";

// Export the `usePremiseAction` hook.
export const usePremiseAction = () => {
  // Get the `dispatch` function from the React Redux Provider.
  const dispatch = useDispatch();

  // Bind the action creators to the `dispatch` function.
  return useMemo(
    () => bindActionCreators(premiseActionCreators, dispatch),
    [dispatch],
  );
};
