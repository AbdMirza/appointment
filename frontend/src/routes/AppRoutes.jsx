import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Public
import Home from "../pages/Home";

// Auth
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// Admin
import AdminDashboard from "../pages/admin/Dashboard";
import Appointments from "../pages/admin/Appointments";
import Services from "../pages/admin/Services";
import Staff from "../pages/admin/Staff";
import BusinessProfile from "../pages/admin/BusinessProfile";

// Staff
import StaffDashboard from "../pages/staff/StaffDashboard";

// Customer
import CustomerHome from "../pages/customer/Home";
import Businesses from "../pages/customer/Businesses";
import Book from "../pages/customer/Book";
import MyBookings from "../pages/customer/MyBookings";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========== PUBLIC ========== */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ========== ADMIN ========== */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" />}
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["BUSINESS_ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute allowedRoles={["BUSINESS_ADMIN"]}>
              <Appointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/services"
          element={
            <ProtectedRoute allowedRoles={["BUSINESS_ADMIN"]}>
              <Services />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute allowedRoles={["BUSINESS_ADMIN"]}>
              <Staff />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/business-profile"
          element={
            <ProtectedRoute allowedRoles={["BUSINESS_ADMIN"]}>
              <BusinessProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={["STAFF"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/appointments"
          element={
            <ProtectedRoute allowedRoles={["STAFF"]}>
              <Appointments />
            </ProtectedRoute>
          }
        />

        {/* ========== CUSTOMER ========== */}
        <Route
          path="/customer/home"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/businesses"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <Businesses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/book"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <Book />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/my-bookings"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* ========== FALLBACK ========== */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
