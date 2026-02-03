import { useEffect, useState, useCallback, useRef } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";

import Login from "./Components/Login";
import Register from "./Components/Register";
import ResetPassword from "./Components/ResetPassword";
import Navbar from "./Components/Navbar";
import Home from "./Components/Home";
import DocumentsPortal from "./Components/DocumentsPortal";
import FAQs from "./Components/FAQs";
import Profile from "./Components/Profile";
import KMSChatWidget from "./Components/KMSChatWidget";

// Admin pages
import Sidebar from "./Admin/Sidebar";
import Dashboard from "./Admin/Dashboard";
import Analytics from "./Admin/Analytics";
import UserManagement from "./Admin/UserManagement";
import ManageFAQs from "./Admin/ManageFaqs";
import PendingApproval from "./Admin/PendingApproval";

import { supabase } from "./lib/supabaseClient";
import { DarkModeProvider } from "./context/DarkModeContext.jsx";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

import "./Css/DarkMode.css";

/** ✅ Loader UI */
function FullPageLoader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            width: "48px",
            height: "48px",
            border: "4px solid #f3f4f6",
            borderTopColor: "#2563eb",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ marginTop: "1rem", color: "#6b7280" }}>Loading...</p>
      </div>
    </div>
  );
}

/** ✅ Role Guard */
function RequireRole({ userRole, allowed = [] }) {
  if (!allowed.includes(userRole)) {
    return <Navigate to={userRole === "admin" ? "/admin/dashboard" : "/home"} replace />;
  }
  return <Outlet />;
}

/** ✅ Layout: User pages */
function UserLayout({ onLogout }) {
  return (
    <>
      <Navbar onLogout={onLogout} />
      <Outlet />
    </>
  );
}

/** ✅ Layout: Admin pages */
function AdminLayout({ onLogout }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar onLogout={onLogout} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  const { session, authLoading } = useAuth();

  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const lastUserIdRef = useRef(null);

  const hardClearLocal = useCallback(() => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
  }, []);

  const setLocalSession = useCallback((user, role) => {
    localStorage.setItem("userId", user.id);
    localStorage.setItem("userEmail", user.email || "");
    localStorage.setItem(
      "userName",
      user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        ""
    );
    localStorage.setItem("userRole", role);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (e) {
      console.warn("⚠️ signOut issue:", e?.message || e);
    } finally {
      hardClearLocal();
      setUserRole(null);
      setRoleLoading(false);
      navigate("/login", { replace: true });
    }
  }, [hardClearLocal, navigate]);

  const ensureProfileExists = useCallback(async (user) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("⚠️ ensureProfileExists fetch error:", error);
      return;
    }

    if (!profile) {
      const { error: insertErr } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "",
        role: "user",
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
        is_active: true,
      });

      if (insertErr) console.warn("⚠️ ensureProfileExists insert error:", insertErr);
    }
  }, []);

  const fetchRoleFromProfiles = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("⚠️ Profile fetch error (likely RLS):", error);
      // ✅ don’t block forever; default to user if cannot read
      return { role: "user", isActive: true };
    }

    return {
      role: data?.role || "user",
      isActive: data?.is_active !== false,
    };
  }, []);

  // ✅ Load role whenever session changes
  useEffect(() => {
    // If auth is still restoring session, wait
    if (authLoading) return;

    // No session => logged out
    if (!session?.user) {
      hardClearLocal();
      setUserRole(null);
      setRoleLoading(false);

      // If on protected route, push to login
      const publicRoutes = ["/", "/login", "/register", "/reset-password"];
      if (!publicRoutes.includes(location.pathname)) {
        navigate("/login", { replace: true });
      }
      return;
    }

    const user = session.user;

    // prevent repeated loads
    if (lastUserIdRef.current === user.id) {
      setRoleLoading(false);
      return;
    }
    lastUserIdRef.current = user.id;

    setRoleLoading(true);

    // ✅ Safety timeout so role loading can NEVER be infinite
    const safety = setTimeout(() => {
      console.warn("⚠️ Role loading stuck — defaulting to user");
      setUserRole("user");
      setRoleLoading(false);
    }, 5000);

    (async () => {
      try {
        // fast cached role
        const cachedRole = localStorage.getItem("userRole");
        const cachedUserId = localStorage.getItem("userId");
        if (cachedRole && cachedUserId === user.id) {
          setUserRole(cachedRole);
        }

        await ensureProfileExists(user);

        const { role, isActive } = await fetchRoleFromProfiles(user.id);

        if (!isActive) {
          await handleLogout();
          return;
        }

        setLocalSession(user, role);
        setUserRole(role);

        // redirect from public pages only
        const publicRoutes = ["/", "/login", "/register", "/reset-password"];
        if (publicRoutes.includes(location.pathname)) {
          navigate(role === "admin" ? "/admin/dashboard" : "/home", { replace: true });
        }
      } catch (e) {
        console.warn("role load exception:", e);
        setUserRole("user");
      } finally {
        clearTimeout(safety);
        setRoleLoading(false);
      }
    })();

    return () => clearTimeout(safety);
  }, [
    authLoading,
    session,
    location.pathname,
    navigate,
    hardClearLocal,
    ensureProfileExists,
    fetchRoleFromProfiles,
    setLocalSession,
    handleLogout,
  ]);

  const isReady = !authLoading && !roleLoading;
  const isLoggedIn = !!session?.user;

  return (
    <DarkModeProvider>
      <Routes>
        {/* Root */}
        <Route
          path="/"
          element={
            !isReady ? (
              <FullPageLoader />
            ) : isLoggedIn ? (
              <Navigate to={userRole === "admin" ? "/admin/dashboard" : "/home"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Public */}
        <Route path="/login" element={<Login onNavigateToRegister={() => navigate("/register")} />} />
        <Route path="/register" element={<Register onNavigateToLogin={() => navigate("/login")} />} />
        <Route path="/reset-password" element={<ResetPassword onNavigateToLogin={() => navigate("/login")} />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          {/* USER */}
          <Route element={<RequireRole userRole={userRole} allowed={["user"]} />}>
            <Route element={<UserLayout onLogout={handleLogout} />}>
              <Route path="/home" element={<Home onNavigateToDocuments={() => navigate("/documents")} />} />
              <Route path="/documents" element={<DocumentsPortal />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* ADMIN */}
          <Route element={<RequireRole userRole={userRole} allowed={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout onLogout={handleLogout} />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route path="manage-faqs" element={<ManageFAQs />} />
              <Route path="pending-approval" element={<PendingApproval />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {isLoggedIn && <KMSChatWidget />}
    </DarkModeProvider>
  );
}
