import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const Book = () => {
  const { logout, token } = useAuth();
  const navigate = useNavigate();

  // State
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState(null); // Date object
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState({});
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [businessHours, setBusinessHours] = useState([]);

  const businessId = localStorage.getItem("selectedBusinessId");
  const businessName = localStorage.getItem("selectedBusinessName");

  // Fetch services and business hours
  useEffect(() => {
    if (!businessId) {
      navigate("/customer/businesses");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [servicesRes, hoursRes] = await Promise.all([
          fetch(`${API_URL}/services/public/${businessId}`),
          fetch(`${API_URL}/business/public/${businessId}/hours`)
        ]);

        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setServices(data);
        }
        if (hoursRes.ok) {
          const hoursData = await hoursRes.json();
          setBusinessHours(hoursData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId, navigate]);

  // Fetch slots when service + date changes
  const fetchSlots = useCallback(async (serviceId, date, signal) => {
    if (!serviceId || !date || !businessId) return;

    const dateStr = formatDate(date);
    console.log(`[Book.jsx] Fetching slots for ${dateStr}, service ${serviceId}`);

    setSlotsLoading(true);
    // Important: Clear current slots for THIS date so we don't show old data while loading
    setSlots(prev => ({ ...prev, [dateStr]: [] }));

    try {
      const res = await fetch(
        `${API_URL}/availability/slots?businessId=${businessId}&serviceId=${serviceId}&startDate=${dateStr}&endDate=${dateStr}`,
        { signal }
      );
      if (res.ok) {
        const data = await res.json();
        console.log(`[Book.jsx] Received slots for ${dateStr}:`, data);
        setSlots(data.data || data || {});
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log(`[Book.jsx] Fetch aborted for ${dateStr}`);
      } else {
        console.error("Error fetching slots:", error);
      }
    } finally {
      setSlotsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    const controller = new AbortController();
    if (selectedService && selectedDate) {
      setSelectedSlot(null);
      fetchSlots(selectedService, selectedDate, controller.signal);
    }
    return () => controller.abort();
  }, [selectedService, selectedDate, fetchSlots]);

  // Calendar helpers
  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  function isPast(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  function isClosedDay(date) {
    const dayOfWeek = date.getDay();
    const hours = businessHours.find(h => h.dayOfWeek === dayOfWeek);
    return hours && !hours.isOpen;
  }

  function isSameDate(d1, d2) {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  }

  // Build calendar grid
  const calendarDays = [];
  const daysInMonth = getDaysInMonth(calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarMonth);

  // Fill leading blanks
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
  }

  const prevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  // Can't go before current month
  const canGoPrev = calendarMonth.getFullYear() > new Date().getFullYear() ||
    (calendarMonth.getFullYear() === new Date().getFullYear() && calendarMonth.getMonth() > new Date().getMonth());

  // Format time from ISO string
  function formatTime(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  // Group slots by staff
  const dateStr = selectedDate ? formatDate(selectedDate) : null;
  const daySlots = dateStr ? (slots[dateStr] || []) : [];

  const staffMap = {};
  daySlots.forEach(slot => {
    if (!staffMap[slot.staffId]) {
      staffMap[slot.staffId] = { name: slot.staffName, slots: [] };
    }
    staffMap[slot.staffId].slots.push(slot);
  });

  const staffEntries = Object.entries(staffMap);
  const hasMultipleStaff = staffEntries.length > 1;

  // Handle booking
  const handleBook = async () => {
    if (!selectedSlot) return;

    setBooking(true);
    try {
      const res = await fetch(`${API_URL}/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: selectedService,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          staffId: selectedSlot.staffId
        }),
      });

      if (res.ok) {
        alert("Booking Confirmed!");
        navigate("/customer/my-bookings");
      } else {
        const data = await res.json();
        alert(data.message || "Booking failed. The slot may no longer be available.");
      }
    } catch (error) {
      alert("Booking failed");
    } finally {
      setBooking(false);
    }
  };

  const selectedServiceData = services.find(s => s.id === selectedService);

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

      <main className="w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center">
        <div className="w-full bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-slate-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 sm:p-14 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3">Book Appointment</h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20">
              <span className="text-white/80">Booking at</span>
              <span className="font-bold">{businessName || "selected business"}</span>
            </div>
          </div>

          <div className="p-6 sm:p-12">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
                <p className="text-slate-500 font-medium">Loading details...</p>
              </div>
            ) : (
              <div className="space-y-10">
                {/* ============ STEP 1: CHOOSE SERVICE ============ */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">1</span>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Choose a Service</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => { setSelectedService(service.id); setSelectedDate(null); setSelectedSlot(null); setSlots({}); }}
                        className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 group ${selectedService === service.id
                          ? "border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/5"
                          : "border-slate-100 bg-slate-50/30 hover:border-slate-300 hover:shadow-md"
                          }`}
                      >
                        <div className="flex flex-col h-full">
                          <span className="font-bold text-slate-800 text-lg mb-1">{service.name}</span>
                          {service.description && (
                            <span className="text-slate-400 text-xs mb-2 line-clamp-2">{service.description}</span>
                          )}
                          <div className="flex items-center gap-3 mt-auto">
                            <span className="text-slate-500 text-sm flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {service.duration} min
                            </span>
                            <span className="font-black text-blue-600">
                              {service.price > 0 ? `$${service.price}` : "Free"}
                            </span>
                          </div>
                        </div>

                        {selectedService === service.id && (
                          <div className="absolute top-4 right-4 text-blue-600 animate-in fade-in">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {services.length === 0 && (
                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl text-center">
                      <p className="text-amber-800 font-medium">No active services currently available for this business.</p>
                    </div>
                  )}
                </div>

                {/* ============ STEP 2: PICK A DATE ============ */}
                {selectedService && (
                  <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">2</span>
                      <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Pick a Date</h2>
                    </div>

                    {/* Calendar */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden max-w-md mx-auto">
                      {/* Month Header */}
                      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700">
                        <button
                          onClick={prevMonth}
                          disabled={!canGoPrev}
                          className="p-2 rounded-lg hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h3 className="text-white font-bold text-lg">
                          {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                        </h3>
                        <button
                          onClick={nextMonth}
                          className="p-2 rounded-lg hover:bg-white/10 text-white transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>

                      {/* Day Headers */}
                      <div className="grid grid-cols-7 gap-0">
                        {DAYS_SHORT.map(d => (
                          <div key={d} className="text-center py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Day Grid */}
                      <div className="grid grid-cols-7 gap-0 px-2 pb-4">
                        {calendarDays.map((date, i) => {
                          if (!date) {
                            return <div key={`blank-${i}`} className="p-2"></div>;
                          }

                          const past = isPast(date);
                          const closed = isClosedDay(date);
                          const today = isToday(date);
                          const selected = isSameDate(date, selectedDate);
                          const disabled = past || closed;

                          return (
                            <button
                              key={i}
                              onClick={() => !disabled && setSelectedDate(new Date(date))}
                              disabled={disabled}
                              className={`relative p-2 m-0.5 rounded-xl text-sm font-semibold transition-all duration-200
                                ${selected
                                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110 z-10"
                                  : today
                                    ? "bg-blue-50 text-blue-700 border-2 border-blue-300"
                                    : disabled
                                      ? "text-slate-300 cursor-not-allowed"
                                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                                }
                              `}
                              title={closed ? "Business closed" : past ? "Past date" : ""}
                            >
                              {date.getDate()}
                              {closed && !past && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-center gap-4 px-4 pb-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-300"></span> Today
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-400"></span> Closed
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============ STEP 3: PICK A TIME SLOT ============ */}
                {selectedService && selectedDate && (
                  <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">3</span>
                      <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Pick a Time</h2>
                    </div>

                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
                      <p className="text-sm text-slate-500 mb-4">
                        Available slots for <span className="font-bold text-slate-700">{selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
                      </p>

                      {slotsLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent"></div>
                          <span className="ml-3 text-slate-500 font-medium">Loading available slots...</span>
                        </div>
                      ) : daySlots.length === 0 ? (
                        <div className="text-center py-10">
                          <div className="text-5xl mb-3">😔</div>
                          <p className="text-slate-500 font-medium">No available slots for this date.</p>
                          <p className="text-slate-400 text-sm mt-1">Try a different date or service.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {staffEntries.map(([staffId, staffData]) => (
                            <div key={staffId}>
                              {hasMultipleStaff && (
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                    {staffData.name?.charAt(0)?.toUpperCase() || "S"}
                                  </div>
                                  <span className="font-semibold text-slate-700">{staffData.name}</span>
                                </div>
                              )}
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {staffData.slots.map((slot, idx) => {
                                  const isSelected = selectedSlot &&
                                    selectedSlot.startTime === slot.startTime &&
                                    selectedSlot.staffId === slot.staffId;

                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setSelectedSlot(slot)}
                                      className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-200
                                        ${isSelected
                                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                                          : "bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md"
                                        }
                                      `}
                                    >
                                      {formatTime(slot.startTime)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ============ STEP 4: CONFIRM ============ */}
                {selectedSlot && (
                  <div className="animate-in slide-in-from-bottom-4 duration-500">
                    {/* Booking Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                        Booking Summary
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between sm:flex-col">
                          <span className="text-slate-500">Service</span>
                          <span className="font-semibold text-slate-800">{selectedServiceData?.name}</span>
                        </div>
                        <div className="flex justify-between sm:flex-col">
                          <span className="text-slate-500">Date</span>
                          <span className="font-semibold text-slate-800">
                            {selectedDate?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex justify-between sm:flex-col">
                          <span className="text-slate-500">Time</span>
                          <span className="font-semibold text-slate-800">
                            {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                          </span>
                        </div>
                        <div className="flex justify-between sm:flex-col">
                          <span className="text-slate-500">With</span>
                          <span className="font-semibold text-slate-800">{selectedSlot.staffName}</span>
                        </div>
                        {selectedServiceData?.price > 0 && (
                          <div className="flex justify-between sm:flex-col">
                            <span className="text-slate-500">Price</span>
                            <span className="font-black text-blue-600 text-lg">${selectedServiceData.price}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confirm Button */}
                    <button
                      onClick={handleBook}
                      disabled={booking}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {booking ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Processing Booking...</span>
                        </div>
                      ) : (
                        "Confirm Appointment"
                      )}
                    </button>
                    <p className="text-center text-slate-400 text-sm mt-4">
                      Your appointment will be automatically assigned to {selectedSlot.staffName}.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Book;
