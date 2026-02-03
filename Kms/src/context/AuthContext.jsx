import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // ✅ Safety timeout: never stuck loading forever
    const safety = setTimeout(() => {
      if (!mountedRef.current) return;
      console.warn("⚠️ Auth restore taking too long — releasing loader.");
      setAuthLoading(false);
    }, 4000);

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn("getSession error:", error);

        if (!mountedRef.current) return;
        setSession(data?.session ?? null);
      } catch (e) {
        console.warn("getSession exception:", e);
      } finally {
        if (!mountedRef.current) return;
        setAuthLoading(false);
        clearTimeout(safety);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mountedRef.current) return;
      setSession(newSession ?? null);
      setAuthLoading(false);
      clearTimeout(safety);

      // ✅ optional: clear hash so it doesn't cause weird loops
      
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(safety);
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
