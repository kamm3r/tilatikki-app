import { useEffect } from "react";
import Cookies from "universal-cookie";
import { useUserAction } from "~/hooks/useUser";

export function AuthChecker() {
  const { getMe } = useUserAction();

  useEffect(() => {
    const cookies = new Cookies();
    async function autoLogin() {
      const tilatikkiCookie = cookies.get("tilatikkiToken");

      if (tilatikkiCookie) {
        getMe();
      }
    }
    // console.log("Cookie exists", cookies.get("tilatikkiToken") ? "YES" : "NO");
    autoLogin();
  }, [getMe]);

  return null;
}
