import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const MyBookings = () => {
  const { logout, token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/appointments/my-bookings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBookings(data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token]);

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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center">
      {/* Navbar */}
      <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center text-slate-600">
        <Link to="/customer/home" className="group flex items-center gap-2 hover:text-blue-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-semibold">Back to Home</span>
        </Link>
        <button
          onClick={logout}
          className="bg-white px-5 py-2 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
        >
          Logout
        </button>
      </nav>

      <main className="w-full max-w-5xl px-6 py-12">
        <div className="flex flex-col items-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">My Bookings</h1>
          <p className="text-slate-500">Track your past and upcoming appointments</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-slate-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-5 font-bold">Service</th>
                  <th className="px-8 py-5 font-bold">Business</th>
                  <th className="px-8 py-5 font-bold">Date</th>
                  <th className="px-8 py-5 font-bold">Time</th>
                  <th className="px-8 py-5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3"></div>
                        <p className="text-slate-500 font-medium">Retrieving your bookings...</p>
                      </div>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center opacity-40">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xl font-medium text-slate-800">No bookings found yet.</p>
                        <Link to="/customer/businesses" className="mt-4 text-blue-600 hover:underline font-bold">Book your first appointment</Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <span className="font-bold text-slate-800">{booking.service?.name}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-slate-600 font-medium">
                          {booking.service?.business?.name || "Business"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-slate-600 font-medium">
                        {formatDate(booking.startTime)}
                      </td>
                      <td className="px-8 py-6 text-slate-600">
                        {formatTime(booking.startTime)}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                          booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-600'
                          }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyBookings;
