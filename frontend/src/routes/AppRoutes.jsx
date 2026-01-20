import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

// Staff
import StaffDashboard from "../pages/staff/StaffDashboard";

// Customer
import CustomerHome from "../pages/customer/Home";
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
        <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/appointments" element={<Appointments />} />
        <Route path="/admin/services" element={<Services />} />
        <Route path="/admin/staff" element={<Staff />} />

        {/* ========== STAFF ========== */}
        <Route path="/staff/dashboard" element={<StaffDashboard />} />

        {/* ========== CUSTOMER ========== */}
        <Route path="/customer/home" element={<CustomerHome />} />
        <Route path="/customer/book" element={<Book />} />
        <Route path="/customer/my-bookings" element={<MyBookings />} />

        {/* ========== FALLBACK ========== */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
