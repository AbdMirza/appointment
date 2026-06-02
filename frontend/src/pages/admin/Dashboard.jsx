import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAdminData } from "../../context/AdminDataContext";

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
    <div className="flex items-center gap-4">
      <div className={`${color} text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl shadow-sm`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { business, stats, bookingsPerDay = [], loading } = useAdminData();
  const maxBookings = Math.max(...bookingsPerDay.map((d) => d.count), 1);

  return (
    <div className="p-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-2xl shadow-lg mb-8">
        <h1 className="text-3xl font-bold">Welcome {user?.name || "Admin"}!</h1>
        <p className="text-blue-100 mt-2 text-lg">Here&apos;s what&apos;s happening with your business today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Today's Bookings" value={stats?.todayCount || 0} icon="📅" color="bg-blue-500" />
        <StatCard title="Pending Review" value={stats?.pendingCount || 0} icon="⏳" color="bg-amber-500" />
        <StatCard title="Total Bookings" value={stats?.totalBookings || 0} icon="📊" color="bg-green-500" />
        <StatCard title="Cancellation Rate" value={`${stats?.cancellationRate || 0}%`} icon="❌" color="bg-rose-500" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Bookings per day (last 7 days)</h2>
        <p className="text-sm text-slate-500 mb-6">Daily booking volume for your business</p>
        {loading ? (
          <p className="text-slate-500">Loading chart...</p>
        ) : bookingsPerDay.length === 0 ? (
          <p className="text-slate-500">No booking data for this period.</p>
        ) : (
          <div className="flex items-end gap-3 h-48">
            {bookingsPerDay.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-xs font-semibold text-slate-600">{day.count}</span>
                <div
                  className="w-full bg-blue-500 rounded-t-md min-h-[4px]"
                  style={{ height: `${Math.max((day.count / maxBookings) * 160, 4)}px` }}
                  title={`${day.date}: ${day.count} bookings`}
                />
                <span className="text-[10px] text-slate-500 font-medium">
                  {new Date(`${day.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-slate-800">Business Information</h2>
          <Link
            to="/admin/business-profile"
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            Edit Profile
          </Link>
        </div>
        {loading ? (
          <p className="text-slate-500">Loading business details...</p>
        ) : business ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Business Name</p>
              <p className="text-lg font-semibold text-slate-800">{business.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Address</p>
              <p className="text-slate-700">{business.address}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Contact</p>
              <p className="text-slate-700">{business.contact}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Timezone</p>
              <p className="text-slate-700">{business.timezone}</p>
            </div>
          </div>
        ) : (
          <p className="text-slate-500">Unable to load business details</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
