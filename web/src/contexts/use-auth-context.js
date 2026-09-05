import { useContext } from "react";
import { AuthContext } from "./auth-context-instance";

export function useAuthContext() {
  return useContext(AuthContext);
}
