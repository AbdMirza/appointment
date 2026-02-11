import { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

const Appointments = () => {
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/appointments/business", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments(data);
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAppointments();
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
      if (res.ok) {
        fetchAppointments(); // Refresh
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Appointments</h1>
            <p className="text-slate-500 mt-1">
              {user?.role === "BUSINESS_ADMIN"
                ? "Manage all bookings for your business."
                : "View and manage your assigned bookings."}
            </p>
          </div>
          <button
            onClick={fetchAppointments}
            className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition text-slate-600"
            title="Refresh Data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Customer</th>
                  <th className="px-6 py-4 font-bold">Service</th>
                  <th className="px-6 py-4 font-bold">Date & Time</th>
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
                        <p className="text-slate-500">Retrieving business schedule...</p>
                      </div>
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center opacity-40">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xl font-medium">No appointments found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  appointments.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {app.user?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{app.user?.name}</p>
                            <p className="text-xs text-slate-500">{app.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold ring-1 ring-indigo-100">
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
                          <span className={`w-fit px-2 py-1 rounded-lg text-xs font-bold uppercase ${app.status === 'ASSIGNED' ? 'bg-indigo-100 text-indigo-700' :
                            app.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                              app.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                  app.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
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
                          {app.status === "PENDING" && (
                            <button
                              onClick={() => updateStatus(app.id, "CONFIRMED")}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm"
                            >
                              Approve
                            </button>
                          )}
                          {(app.status === "PENDING" || app.status === "CONFIRMED" || app.status === "ASSIGNED") && (
                            <button
                              onClick={() => updateStatus(app.id, "CANCELLED")}
                              className="px-3 py-1 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition"
                            >
                              Cancel
                            </button>
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

export default Appointments;
