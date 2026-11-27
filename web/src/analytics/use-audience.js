import { createContext, useEffect, useLayoutEffect, useState } from "react";
import { choice, detail, outbound, permit, preferenceKey, saveChoice, visit } from "./measurement";

export const PlayerConsent = createContext(false);

export function useAudience(location) {
  const [decision, setDecision] = useState(choice);
  const [preferences, setPreferences] = useState(false);
  useLayoutEffect(() => {
    permit(decision);
    visit(location.key, location.pathname);
    window.dispatchEvent(new Event("caribe:audience-ready"));
  }, [decision, location.key, location.pathname]);

  useEffect(() => {
    function sync(event) {
      if (event.type === "storage" && event.key !== null && event.key !== preferenceKey) return;
      const value = choice();
      permit(value);
      setDecision(value);
    }
    const syncTimer = setInterval(sync.bind(null, { type: "expiry" }), 60000);
    window.addEventListener("storage", sync);
    window.addEventListener("pageshow", sync);
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("click", outbound, true);
    return () => {
      clearInterval(syncTimer);
      window.removeEventListener("storage", sync);
      window.removeEventListener("pageshow", sync);
      document.removeEventListener("visibilitychange", sync);
      document.removeEventListener("click", outbound, true);
    };
  }, []);

  function choose(value) {
    permit(value);
    saveChoice(value);
    setDecision(value);
    setPreferences(false);
  }
  return { show: !decision || preferences, allowPlayers: decision === "yes", choose, open: () => setPreferences(true) };
}

export function useContentView(section, item) {
  useEffect(() => {
    const report = () => detail(section, item);
    report();
    window.addEventListener("caribe:audience-ready", report);
    return () => window.removeEventListener("caribe:audience-ready", report);
  }, [section, item]);
}
