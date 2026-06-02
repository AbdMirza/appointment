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
import Customers from "../pages/admin/Customers";
import BusinessProfile from "../pages/admin/BusinessProfile";
import LeaveRequests from "../pages/admin/LeaveRequests";
import BookingSettings from "../pages/admin/BookingSettings";
import FinanceReport from "../pages/admin/FinanceReport";
import AuditLogs from "../pages/admin/AuditLogs";


// Staff
import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffTimeOff from "../pages/staff/StaffTimeOff";

// Customer
import CustomerHome from "../pages/customer/Home";
import Businesses from "../pages/customer/Businesses";
import Book from "../pages/customer/Book";
import MyBookings from "../pages/customer/MyBookings";
import Profile from "../pages/customer/Profile";
import PaymentSuccess from "../pages/customer/PaymentSuccess";

import AdminLayout from "../components/layout/AdminLayout";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========== PUBLIC ========== */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ========== ADMIN ROUTES WRAPPED IN ADMINLAYOUT ========== */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["BUSINESS_ADMIN"]}>
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="appointments" element={<Appointments />} />
                  <Route path="services" element={<Services />} />
                  <Route path="staff" element={<Staff />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="business-profile" element={<BusinessProfile />} />
                  <Route path="leave-requests" element={<LeaveRequests />} />
                  <Route path="booking-settings" element={<BookingSettings />} />
                  <Route path="finance" element={<FinanceReport />} />
                  <Route path="audit-logs" element={<AuditLogs />} />
                  <Route path="*" element={<Navigate to="dashboard" />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ========== STAFF ========== */}
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

        <Route
          path="/staff/time-off"
          element={
            <ProtectedRoute allowedRoles={["STAFF"]}>
              <StaffTimeOff />
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

        <Route
          path="/customer/profile"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-success"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <PaymentSuccess />
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
