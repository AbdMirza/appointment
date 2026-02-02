import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

const Dashboard = () => {
  const { user, token } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch business details
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/business/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBusiness(data);
        }
      } catch (err) {
        console.error("Error fetching business:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchBusiness();
  }, [token]);

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-2xl shadow-lg mb-8">
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.name || "Admin"}!
          </h1>
          <p className="text-blue-100 mt-2 text-lg">
            Here's what's happening with your business today
          </p>
        </div>

        {/* Business Info Card */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-slate-800">Business Information</h2>
            <Link
              to="/admin/business-profile"
              className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </Link>
          </div>

          {loading ? (
            <p className="text-slate-500">Loading business details...</p>
          ) : business ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Business Name</p>
                  <p className="text-lg font-semibold text-slate-800">{business.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Address</p>
                  <p className="text-slate-700">{business.address}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contact</p>
                  <p className="text-slate-700">{business.contact}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Timezone</p>
                  <p className="text-slate-700">{business.timezone}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">Unable to load business details</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Bookings</p>
                <h2 className="text-3xl font-bold mt-1 text-slate-800">124</h2>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Today's Appointments</p>
                <h2 className="text-3xl font-bold mt-1 text-slate-800">12</h2>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Staff Members</p>
                <h2 className="text-3xl font-bold mt-1 text-slate-800">8</h2>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Revenue</p>
                <h2 className="text-3xl font-bold mt-1 text-slate-800">$1,240</h2>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
