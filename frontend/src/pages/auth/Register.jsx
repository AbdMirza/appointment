import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Auto-detect timezone on load
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER",
    // Business fields
    businessName: "",
    businessAddress: "",
    businessContact: "",
    businessTimezone: detectedTimezone
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.errors
          ? Object.values(data.errors).flat().join(", ")
          : data.message;
        alert(errorMsg || "Registration failed");
        return;
      }

      login(data.user, data.accessToken, data.refreshToken);

      if (data.user.role === "BUSINESS_ADMIN") {
        navigate("/admin/dashboard");
      } else if (data.user.role === "STAFF") {
        navigate("/staff/dashboard");
      } else {
        navigate("/customer/home");
      }
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      alert("Server error during registration");
    }
  };

  const isBusinessAdmin = form.role === "BUSINESS_ADMIN";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 py-8 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-center mb-6">
          Create Account
        </h2>

        <div className="space-y-4">
          {/* Personal Info */}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={handleChange}
            required
          />

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Register as:
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="STAFF">Staff Member</option>
              <option value="BUSINESS_ADMIN">Business Owner / Admin</option>
            </select>
          </div>

          {/* Business Details - Only for BUSINESS_ADMIN */}
          {isBusinessAdmin && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-800 mb-2">
                Business Information
              </p>

              <input
                type="text"
                name="businessName"
                placeholder="Business Name"
                className="w-full p-3 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={form.businessName}
                onChange={handleChange}
                required
              />

              <textarea
                name="businessAddress"
                placeholder="Business Address"
                rows={2}
                className="w-full p-3 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white resize-none"
                value={form.businessAddress}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="businessContact"
                placeholder="Contact (Phone or Email)"
                className="w-full p-3 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={form.businessContact}
                onChange={handleChange}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-blue-600 mb-1">
                  Business Timezone
                </label>
                <select
                  name="businessTimezone"
                  value={form.businessTimezone}
                  onChange={handleChange}
                  className="w-full p-3 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  required
                >
                  {Intl.supportedValuesOf('timeZone').map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <button className="w-full bg-blue-600 text-white p-3 rounded mt-6 font-semibold hover:bg-blue-700 transition duration-200">
          Sign Up
        </button>

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
 