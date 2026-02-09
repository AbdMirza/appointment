import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api";

// For now, we'll use a hardcoded business ID or get it from context/localStorage
// In production, this would come from the URL or user's context
const BUSINESS_ID = localStorage.getItem("businessId") || "";

const Book = () => {
  const { logout, user, token } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [booking, setBooking] = useState(false);

  // Fetch active services for the business
  useEffect(() => {
    const fetchServices = async () => {
      try {
        // For customer view, we need the business ID
        // This could come from the URL, localStorage, or the user's booking context
        const businessId = localStorage.getItem("selectedBusinessId") || BUSINESS_ID;

        if (!businessId) {
          console.log("No business ID available - showing placeholder");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/services/public/${businessId}`);
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        } else {
          console.error("Failed to fetch services");
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedService || !selectedDate || !selectedTime) {
      alert("Please fill in all fields");
      return;
    }

    setBooking(true);

    // TODO: Implement booking API call in Sprint 3
    // For now, just show a success message
    setTimeout(() => {
      alert("Booking functionality will be implemented in Sprint 3!");
      setBooking(false);
    }, 1000);
  };

  // Get today's date for min date attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-indigo-100 flex flex-col items-center p-6">

      <div className="w-full max-w-4xl flex justify-between mb-10">
        <Link
          to="/customer/home"
          className="bg-white text-blue-600 px-5 py-2 rounded-xl font-bold shadow hover:bg-blue-50 transition"
        >
          ← Back
        </Link>
        <button
          onClick={logout}
          className="bg-white text-red-600 px-5 py-2 rounded-xl font-bold shadow hover:bg-red-50 transition"
        >
          Logout
        </button>
      </div>

      <div className="bg-white shadow-xl rounded-2xl p-8 sm:p-12 max-w-md w-full">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-gray-800">
          Book an Appointment
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Service
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
                required
              >
                <option value="">Choose a service...</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.duration} min
                    {service.price > 0 ? ` ($${service.price})` : " (Free)"}
                  </option>
                ))}
              </select>
              {services.length === 0 && !loading && (
                <p className="text-sm text-gray-500 mt-1">
                  No services available at this time.
                </p>
              )}
            </div>

            {/* Selected Service Details */}
            {selectedService && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                {(() => {
                  const service = services.find(s => s.id === selectedService);
                  if (!service) return null;
                  return (
                    <>
                      <h3 className="font-semibold text-blue-800">{service.name}</h3>
                      <p className="text-sm text-blue-600 mt-1">
                        Duration: {service.duration} minutes
                        {service.price > 0 && ` • Price: $${service.price}`}
                      </p>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Time
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={booking || services.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {booking ? "Booking..." : "Confirm Booking"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Book;
