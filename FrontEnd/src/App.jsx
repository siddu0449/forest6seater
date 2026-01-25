import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./output.css";

import Navbar from "./Components/Nabvbar/Navabar";
import ExternalVisitor from "./Components/Extrnal visitor/Extrnalpage";
import Login from "./Components/Login/Login";
import ReceptionDashboard from "./Components/ReceptionDashboard/ReceptionDashboard";
import GateDashboard from "./Components/GateDashboard/GateDashboard";
import ManagerDashboard from "./Components/ManagerDashboard/ManagerDashboard";
import ManageVehicleDriver from "./Components/ManagerDashboard/ManageVehicleDriver";
import TimeSlotManagement from "./Components/ManagerDashboard/TimeSlotManagement";
import ReportsAnalytics from "./Components/ManagerDashboard/ReportsAnalytics";
import PasswordManagement from "./Components/ManagerDashboard/PasswordManagement";

import { ROLES } from "./Components/constants/roles";
import { isLoggedIn } from "./utils/auth";

// 🔐 ProtectedRoute
const ProtectedRoute = ({ children, role }) => {
  const loggedIn = isLoggedIn();
  const userRole = localStorage.getItem("userRole");

  if (!loggedIn) return <Navigate to="/login" />;
  if (role && userRole !== role) return <Navigate to="/login" />;

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* External Visitor */}
        <Route path="/" element={<ExternalVisitor />} />

        {/* Reception */}
        <Route
          path="/reception"
          element={
            <ProtectedRoute role={ROLES.RECEPTION}>
              <ReceptionDashboard />
            </ProtectedRoute>
          }
        />

        {/* ✅ Manager Routes */}
        <Route
          path="/manager"
          element={<Navigate to="/manager/dashboard" />}
        />

        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute role={ROLES.MANAGER}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/manage"
          element={
            <ProtectedRoute role={ROLES.MANAGER}>
              <ManageVehicleDriver />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/timeslots"
          element={
            <ProtectedRoute role={ROLES.MANAGER}>
              <TimeSlotManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/reports"
          element={
            <ProtectedRoute role={ROLES.MANAGER}>
              <ReportsAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/password"
          element={
            <ProtectedRoute role={ROLES.MANAGER}>
              <PasswordManagement />
            </ProtectedRoute>
          }
        />

        {/* Gate */}
        <Route
          path="/gate"
          element={
            <ProtectedRoute role={ROLES.GATE}>
              <GateDashboard />
            </ProtectedRoute>
          }
        />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
