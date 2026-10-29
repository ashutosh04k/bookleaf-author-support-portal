import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";

import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";

import { Login } from "./pages/Login";
import { BooksPage } from "./pages/author/BooksPage";
import { RaiseQueryPage } from "./pages/author/RaiseQueryPage";
import { TicketsPage } from "./pages/author/TicketsPage";
import { TicketDetailPage } from "./pages/author/TicketDetailPage";

import { QueuePage } from "./pages/admin/QueuePage";
import { AdminTicketDetailPage } from "./pages/admin/AdminTicketDetailPage";
import { ServerWarmupAlert } from "./components/ServerWarmupAlert";

// Protected Layout Component
function ProtectedLayout({ children, requiredRole }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)", color: "var(--text-muted)" }}>
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === "admin" ? "/admin/queue" : "/author/books"} replace />;
  }

  return (
    <div className="app-wrapper">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

// Root Route Redirect Handler
function RootRedirect() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin/queue" : "/author/books"} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <ServerWarmupAlert />
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Author Routes */}
              <Route
                path="/author/books"
                element={
                  <ProtectedLayout requiredRole="author">
                    <BooksPage />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/author/raise-query"
                element={
                  <ProtectedLayout requiredRole="author">
                    <RaiseQueryPage />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/author/tickets"
                element={
                  <ProtectedLayout requiredRole="author">
                    <TicketsPage />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/author/tickets/:id"
                element={
                  <ProtectedLayout requiredRole="author">
                    <TicketDetailPage />
                  </ProtectedLayout>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/queue"
                element={
                  <ProtectedLayout requiredRole="admin">
                    <QueuePage assignedOnly={false} />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/admin/assigned"
                element={
                  <ProtectedLayout requiredRole="admin">
                    <QueuePage assignedOnly={true} />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/admin/tickets/:id"
                element={
                  <ProtectedLayout requiredRole="admin">
                    <AdminTicketDetailPage />
                  </ProtectedLayout>
                }
              />

              {/* Default Root */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
