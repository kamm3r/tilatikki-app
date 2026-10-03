import {
  Outlet,
  createBrowserRouter,
  RouterProvider,
  useNavigation,
  useLocation,
} from "react-router-dom";
import { Provider } from "react-redux";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Premise } from "./pages/Premise";
import { Header } from "~/@/components/Header";

import { store } from "~/Redux/store";
import { AuthChecker } from "~/utils/AutoChecker";
import { Profile } from "./pages/Settings";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "premises/:id",
        children: [
          {
            index: true,
            element: <Premise />,
          },
        ],
      },
      {
        path: "settings",
        element: <Profile />,
      },
    ],
  },
]);

function Layout() {
  const navigation = useNavigation();
  const { pathname } = useLocation();
  const isReservationMap =
    pathname === "/" || /^\/premises\/[^/]+\/?$/.test(pathname);
  return (
    <>
      {pathname === "/login" || pathname === "/register" ? (
        <Outlet />
      ) : (
        <div
          className={`bg-muted/30 relative flex w-full min-w-0 flex-col ${isReservationMap ? "h-dvh overflow-hidden" : "min-h-dvh"}`}
        >
          <Header />
          {navigation.state !== "idle" && <p>Navigation in progress...</p>}
          <Outlet />
          {!isReservationMap && (
            <footer className="text-muted-foreground mx-auto flex w-full max-w-[1440px] shrink-0 px-4 py-4 text-xs sm:px-6 lg:px-8">
              <span>
                Created by &hearts;{" "}
                <a href="/" className="font-bold">
                  Virittämö
                </a>
              </span>
            </footer>
          )}
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AuthChecker />
      <RouterProvider router={router} />
    </Provider>
  );
}
