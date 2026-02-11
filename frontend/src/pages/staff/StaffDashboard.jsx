import { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

const StaffDashboard = () => {
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    completed: 0
  });
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markNotifRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };


  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/appointments/business", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments(data);
        calculateStats(data);
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const today = new Date().toDateString();
    const todayCount = data.filter(app => new Date(app.startTime).toDateString() === today).length;
    const upcomingCount = data.filter(app => app.status === "CONFIRMED" || app.status === "PENDING").length;
    const completedCount = data.filter(app => app.status === "COMPLETED").length;

    setStats({
      today: todayCount,
      upcoming: upcomingCount,
      completed: completedCount
    });
  };

  useEffect(() => {
    if (token) {
      fetchAppointments();
      fetchNotifications();
      // Polling for notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);


  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        fetchAppointments(); // Refresh
      } else {
        alert(data.message || "Error updating status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Staff Dashboard</h1>
            <p className="text-slate-500 mt-1">
              Welcome back, <span className="font-semibold text-blue-600">{user?.name}</span>! Here's what's happening today.
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-500">Staff Member</p>
            </div>
          </div>
        </div>

        {/* Notifications Bar */}
        {notifications.filter(n => !n.isRead).length > 0 && (
          <div className="mb-6 space-y-3">
            {notifications.filter(n => !n.isRead).slice(0, 3).map(notif => (
              <div key={notif.id} className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-sm font-semibold">{notif.message}</p>
                </div>
                <button
                  onClick={() => markNotifRead(notif.id)}
                  className="text-xs bg-white text-blue-600 px-3 py-1 rounded-lg font-bold hover:bg-blue-50 transition"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Stats Grid */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Today's Appointments</p>
                <p className="text-2xl font-bold text-slate-800">{stats.today}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Upcoming Bookings</p>
                <p className="text-2xl font-bold text-slate-800">{stats.upcoming}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">LifeTime Completed</p>
                <p className="text-2xl font-bold text-slate-800">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Recent Assignments</h2>
            <button
              onClick={fetchAppointments}
              className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Customer</th>
                  <th className="px-6 py-4 font-bold">Service</th>
                  <th className="px-6 py-4 font-bold">Time</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3"></div>
                        <p className="text-slate-500">Loading appointments...</p>
                      </div>
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center opacity-40">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xl font-medium">No appointments assigned to you.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  appointments.filter(app => ["CONFIRMED", "ASSIGNED"].includes(app.status)).map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800">{app.user?.name}</p>
                          <p className="text-xs text-slate-500">{app.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold ring-1 ring-blue-100">
                          {app.service?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{formatDate(app.startTime)}</p>
                          <p className="text-xs text-slate-500">{formatTime(app.startTime)} - {formatTime(app.endTime)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`w-fit px-2 py-1 rounded-lg text-xs font-bold uppercase ${app.status === 'ASSIGNED' ? 'bg-emerald-100 text-emerald-700' :
                            app.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                            {app.status}
                          </span>
                          {app.acceptedBy && (
                            <p className="text-[10px] text-slate-500 italic">Provider: {app.acceptedBy.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {app.status === "CONFIRMED" && (
                            <button
                              onClick={() => updateStatus(app.id, "ASSIGNED")}
                              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm"
                              title="Accept Service"
                            >
                              Accept Service
                            </button>
                          )}
                          {app.status === "ASSIGNED" && (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {app.acceptedById === user?.id ? "Your Assignment" : "Being Handled"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))


                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
