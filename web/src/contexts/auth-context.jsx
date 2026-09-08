import React, {
  useState,
  useEffect
} from "react";

import { logout as destroySession, profile } from "../services/api-services";
import { AuthContext } from "./auth-context-instance";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); 
  // undefined → cargando
  // null → no logueado
  // objeto usuario → logueado

  useEffect(() => {
    profile()
      .then((data) => setUser(data || null))
      .catch(() => setUser(null)); 
  }, []);

  function login(user) {
    setUser(user);
  }

  async function logout() {
    try {
      await destroySession();
    } catch {
      // La sesión también puede haber caducado ya en el servidor.
    }
    setUser(null);
  }

  useEffect(() => {
    if (!user) return undefined;

    let inactivityTimer;
    let lastSessionTouch = Date.now();
    const expireSession = () => logout();
    const resetTimer = () => {
      window.clearTimeout(inactivityTimer);
      inactivityTimer = window.setTimeout(expireSession, 5 * 60 * 1000);
      if (Date.now() - lastSessionTouch > 60 * 1000) {
        lastSessionTouch = Date.now();
        profile().catch(() => setUser(null));
      }
    };
    const activityEvents = ["pointerdown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    window.addEventListener("caribe:session-expired", expireSession);
    resetTimer();

    return () => {
      window.clearTimeout(inactivityTimer);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
      window.removeEventListener("caribe:session-expired", expireSession);
    };
  }, [user]);

  const contextData = {
    user,
    login,
    logout,
  };

  // Mientras user === undefined → aún comprobando sesión
  if (user === undefined) {
    return (
      <div className="text-white bg-black min-vh-100 d-flex justify-content-center align-items-center">
        <span className="text-secondary small">Loading session…</span>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextData}>
      {children}
    </AuthContext.Provider>
  );
}
