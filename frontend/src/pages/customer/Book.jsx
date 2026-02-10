import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api";

const Book = () => {
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [booking, setBooking] = useState(false);

  const businessId = localStorage.getItem("selectedBusinessId");
  const businessName = localStorage.getItem("selectedBusinessName");

  useEffect(() => {
    if (!businessId) {
      navigate("/customer/businesses");
      return;
    }

    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_URL}/services/public/${businessId}`);
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [businessId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) return alert("Fill all fields");

    setBooking(true);
    const start = new Date(`${selectedDate}T${selectedTime}`);
    const service = services.find(s => s.id === selectedService);
    const end = new Date(start.getTime() + service.duration * 60000);

    try {
      const res = await fetch(`${API_URL}/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ serviceId: selectedService, startTime: start, endTime: end }),
      });

      if (res.ok) {
        alert("Booking Confirmed!");
        navigate("/customer/my-bookings");
      }
    } catch (error) {
      alert("Booking failed");
    } finally {
      setBooking(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center">
      {/* Navbar */}
      <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
        <Link to="/customer/businesses" className="group flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-semibold">Back to Businesses</span>
        </Link>
        <button
          onClick={logout}
          className="bg-white text-slate-600 px-5 py-2 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
        >
          Logout
        </button>
      </nav>

      <main className="w-full max-w-4xl px-6 py-12 flex flex-col items-center">
        <div className="w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-slate-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-10 sm:p-14 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Book Appointment</h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20">
              <span className="text-white/80">Booking at</span>
              <span className="font-bold">{businessName || "selected business"}</span>
            </div>
          </div>

          <div className="p-8 sm:p-12">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
                <p className="text-slate-500 font-medium">Loading available services...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
                {/* Service Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                    1. Choose a Service
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <label
                        key={service.id}
                        className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedService === service.id
                            ? "border-blue-500 bg-blue-50/50 ring-4 ring-blue-500/10"
                            : "border-slate-100 bg-slate-50/30 hover:border-slate-300"
                          }`}
                      >
                        <input
                          type="radio"
                          name="service"
                          value={service.id}
                          checked={selectedService === service.id}
                          onChange={(e) => setSelectedService(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex flex-col h-full">
                          <span className="font-bold text-slate-800 text-lg mb-1">{service.name}</span>
                          <span className="text-slate-500 text-sm mb-4">{service.duration} min</span>
                          <span className="mt-auto font-black text-blue-600">
                            {service.price > 0 ? `$${service.price}` : "Complimentary"}
                          </span>
                        </div>
                        {selectedService === service.id && (
                          <div className="absolute top-4 right-4 text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                  {services.length === 0 && (
                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl text-center">
                      <p className="text-amber-800 font-medium">No active services currently available for this business.</p>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                {selectedService && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                    {/* Date Selection */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                        2. Select Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={today}
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                        required
                      />
                    </div>

                    {/* Time Selection */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                        3. Select Time
                      </label>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Footer Action */}
                <div className="pt-8 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={booking || !selectedService || !selectedDate || !selectedTime}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {booking ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing Booking...</span>
                      </div>
                    ) : "Confirm Appointment"}
                  </button>
                  <p className="text-center text-slate-400 text-sm mt-4">
                    A confirmation will be added to your bookings immediately.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Book;
