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
    let active = true;
    profile()
      .then((data) => { if (active) setUser((current) => current === undefined ? data || null : current); })
      .catch(() => { if (active) setUser((current) => current === undefined ? null : current); });
    return () => { active = false; };
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
    // El servidor controla la caducidad compartida. Una pestaña inactiva
    // solo debe bloquear su vista, porque otra puede estar guardando cambios.
    const expireSession = () => setUser(null);
    const resetTimer = () => {
      window.clearTimeout(inactivityTimer);
      inactivityTimer = window.setTimeout(expireSession, 5 * 60 * 1000);
      if (Date.now() - lastSessionTouch > 60 * 1000) {
        lastSessionTouch = Date.now();
        profile().then((current) => { if (!current) expireSession(); }).catch(() => {
          // El interceptor comunica los 401. Un fallo de red permite reintentar.
        });
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

  return (
    <AuthContext.Provider value={contextData}>
      {children}
    </AuthContext.Provider>
  );
}
