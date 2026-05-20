import React, {
  useContext,
  createContext,
  useState,
  useEffect
} from "react";

import { profile } from "../services/api-services";

const AuthContext = createContext();

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

  function logout() {
    setUser(null);
  }

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

// Hook para consumir el contexto
export function useAuthContext() {
  return useContext(AuthContext);
}