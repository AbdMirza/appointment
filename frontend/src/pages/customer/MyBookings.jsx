import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const downloadInvoiceFile = async (invoiceUrl) => {
  if (!invoiceUrl) return;
  // Extract just the filename from the pdfUrl (e.g. "/invoices/INV-DC10F556.pdf" -> "INV-DC10F556.pdf")
  const filename = invoiceUrl.split("/").pop();
  try {
    const response = await api.get(`/invoices/download/${filename}`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Error downloading invoice:", error);
    alert("Failed to download invoice. Please try again later.");
  }
};

// Centralized status colors — same idea as CalendarView's STATUS_CONFIG
const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
  LATE_CANCELLED: "bg-rose-100 text-rose-700 font-bold",
  NO_SHOW: "bg-slate-200 text-slate-600",
  AWAITING_PAYMENT: "bg-purple-100 text-purple-700 font-bold animate-pulse",
};

// Can this booking be cancelled? (based on business policy)
const isCancellable = (booking) => {
  if (!booking) return false;
  const cancellableStatuses = ['PENDING', 'ASSIGNED', 'CONFIRMED'];
  if (!cancellableStatuses.includes(booking.status)) return false;

  const config = booking.service?.business?.bookingConfig;
  const deadline = config?.cancellationDeadline ?? 24;
  const policy = config?.lateCancelPolicy ?? 'BLOCK';

  const now = new Date();
  const startTime = new Date(booking.startTime);
  const diffInHours = (startTime - now) / (1000 * 60 * 60);

  // If policy is ALLOW_LATE_MARK, we show the button regardless of time (until it starts)
  if (policy === 'ALLOW_LATE_MARK') return diffInHours > 0;

  // Otherwise, only show if before deadline
  return diffInHours >= deadline; 
};

const isReschedulable = (booking) => {
  if (!booking) return false;
  const reschedulableStatuses = ['PENDING', 'ASSIGNED', 'CONFIRMED'];
  if (!reschedulableStatuses.includes(booking.status)) return false;

  const config = booking.service?.business?.bookingConfig;
  const deadline = config?.rescheduleDeadline ?? 12;

  const now = new Date();
  const startTime = new Date(booking.startTime);
  const diffInHours = (startTime - now) / (1000 * 60 * 60);

  return diffInHours >= deadline;
};

const MyBookings = () => {
  const { logout, token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null); // For detail modal
  const [reschedulingBooking, setReschedulingBooking] = useState(null); // For reschedule modal
  const [cancelling, setCancelling] = useState(false);

  // Fetch all customer bookings
  useEffect(() => {
    const controller = new AbortController();

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await api.get("/appointments/my-bookings", {
          signal: controller.signal
        });
        setBookings(res.data);
      } catch (error) {
        if (error.name !== "AbortError" && error.message !== "canceled" && error.code !== "ERR_CANCELED") {
          console.error("Error fetching bookings:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchBookings();
    }

    return () => controller.abort();
  }, [token]);

  // Cancel a booking — calls PATCH /appointments/:id/cancel
  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    setCancelling(true);
    try {
      const res = await api.patch(`/appointments/${bookingId}/cancel`, { isAdminOverride: false });
      const data = res.data;
      const updatedBooking = data.data || data.appointment || data;
      const newStatus = updatedBooking.status;

      // Update the booking in local state using the status from server
      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
      );
      // Also update the selected booking if it's the one being viewed
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status: newStatus }));
      }
      alert(newStatus === 'LATE_CANCELLED' ? "Booking marked as Late Cancelled." : "Booking cancelled successfully.");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to cancel booking.";
      alert(errorMsg);
      console.error(error);
    } finally {
      setCancelling(false);
    }
  };

  const handleRetryPayment = async (bookingId) => {
    try {
      const res = await api.post(`/payments/retry/${bookingId}`);
      window.location.href = res.data.checkoutUrl;
    } catch (error) {
      console.error("Payment retry error:", error);
      const errorMsg = error.response?.data?.message || "Failed to initiate payment.";
      alert(errorMsg);
    }
  };




  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
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



  // Is this booking upcoming?
  const isUpcoming = (booking) => {
    return new Date(booking.startTime) > new Date() && !['CANCELLED', 'LATE_CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status);
  };

  // Split bookings into upcoming and past
  const upcomingBookings = bookings.filter(b => isUpcoming(b));
  const pastBookings = bookings.filter(b => !isUpcoming(b));

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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3"></div>
            <p className="text-slate-500 font-medium">Retrieving your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-slate-50 p-20 text-center">
            <div className="flex flex-col items-center opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xl font-medium text-slate-800">No bookings found yet.</p>
              <Link to="/customer/businesses" className="mt-4 text-blue-600 hover:underline font-bold">Book your first appointment</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* ========== UPCOMING BOOKINGS ========== */}
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Upcoming
                </h2>
                <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-500/5 border border-slate-50 overflow-hidden">
                  <BookingTable
                    bookings={upcomingBookings}
                    onView={setSelectedBooking}
                    onReschedule={setReschedulingBooking}
                    onCancel={handleCancel}
                    onPay={handleRetryPayment}
                    cancelling={cancelling}
                    formatDate={formatDate}
                    formatTime={formatTime}
                  />
                </div>
              </div>
            )}

            {/* ========== PAST BOOKINGS ========== */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Past & Cancelled
                </h2>
                <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-500/5 border border-slate-50 overflow-hidden">
                  <BookingTable
                    bookings={pastBookings}
                    onView={setSelectedBooking}
                    onReschedule={setReschedulingBooking}
                    onCancel={handleCancel}
                    onPay={handleRetryPayment}
                    cancelling={cancelling}
                    formatDate={formatDate}
                    formatTime={formatTime}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========== BOOKING DETAIL MODAL ========== */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedBooking(null)}
          ></div>

          {/* Slide-in Panel */}
          <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Panel Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-white">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Panel Body */}
            <div className="p-8 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-sm font-black tracking-wider uppercase ${STATUS_STYLES[selectedBooking.status] || 'bg-slate-100 text-slate-600'}`}>
                  {selectedBooking.status}
                </span>
                {isCancellable(selectedBooking) && (
                  <span className="text-xs text-slate-400">• Can be cancelled</span>
                )}
              </div>

              {/* Detail Cards */}
              <div className="space-y-4">
                <DetailCard label="Service" value={selectedBooking.service?.name} icon="🎯" />
                <DetailCard label="Business" value={selectedBooking.service?.business?.name || "—"} icon="🏢" />
                <DetailCard label="Date" value={formatDate(selectedBooking.startTime)} icon="📅" />
                <DetailCard
                  label="Time"
                  value={`${formatTime(selectedBooking.startTime)} — ${formatTime(selectedBooking.endTime)}`}
                  icon="⏰"
                />
                <DetailCard label="Staff" value={selectedBooking.acceptedBy?.name || "To be assigned"} icon="👤" />
                {selectedBooking.phone && (
                  <DetailCard label="Phone" value={selectedBooking.phone} icon="📱" />
                )}
                {selectedBooking.notes && (
                  <DetailCard label="Notes" value={selectedBooking.notes} icon="📝" />
                )}
                {selectedBooking.payment?.invoice && (
                  <div className="pt-4">
                    <button
                      onClick={() => downloadInvoiceFile(selectedBooking.payment.invoice.pdfUrl)}
                      className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Download Invoice
                    </button>
                  </div>
                )}
                {selectedBooking.status === 'AWAITING_PAYMENT' && (
                  <div className="pt-4">
                    <button
                      onClick={() => handleRetryPayment(selectedBooking.id)}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-purple-500/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Complete Payment Now
                    </button>
                  </div>
                )}
              </div>


              {/* Policy Info Section */}
              {selectedBooking.service?.business?.bookingConfig && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Booking Policy
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Cancellation</p>
                      <p className="text-xs font-semibold text-slate-700">{selectedBooking.service.business.bookingConfig.cancellationDeadline}h notice</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Rescheduling</p>
                      <p className="text-xs font-semibold text-slate-700">{selectedBooking.service.business.bookingConfig.rescheduleDeadline}h notice</p>
                    </div>
                  </div>
                  {selectedBooking.service.business.bookingConfig.lateCancelPolicy === 'ALLOW_LATE_MARK' && (
                    <p className="text-[9px] text-blue-500 font-bold border-t border-slate-200 pt-2 uppercase tracking-tighter">
                      ℹ️ 50% of the total charges will be deducted for late cancellations i.e within 24hr.
                    </p>
                  )}
                </div>
              )}

              {/* Cancel Button — only for cancellable bookings */}
              {isCancellable(selectedBooking) && (
                <button
                  onClick={() => handleCancel(selectedBooking.id)}
                  disabled={cancelling}
                  className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl border-2 border-red-100 hover:bg-red-100 hover:border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {cancelling ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                      <span>Cancelling...</span>
                    </div>
                  ) : (
                    "Cancel This Booking"
                  )}
                </button>
              )}

              {/* Already cancelled notice */}
              {selectedBooking.status === 'CANCELLED' && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                  <p className="text-red-600 font-semibold text-sm">This booking has been cancelled.</p>
                </div>
              )}

              {/* Completed notice */}
              {selectedBooking.status === 'COMPLETED' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                  <p className="text-emerald-600 font-semibold text-sm">This booking has been completed. ✓</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== RESCHEDULE MODAL ========== */}
      {reschedulingBooking && (
        <RescheduleModal
          booking={reschedulingBooking}
          token={token}
          onClose={() => setReschedulingBooking(null)}
          onSuccess={(updatedBooking) => {
            setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
            setReschedulingBooking(null);
            if (selectedBooking?.id === updatedBooking.id) setSelectedBooking(updatedBooking);
          }}
        />
      )}
    </div>
  );
};

// ========== Reusable Components ==========

/** A single row of detail info inside the modal */
const DetailCard = ({ label, value, icon }) => (
  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
    <span className="text-xl">{icon}</span>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

/** The booking table used for both Upcoming and Past sections */
const BookingTable = ({ bookings, onView, onReschedule, onCancel, onPay, cancelling, formatDate, formatTime }) => {
  return (
    <div className="overflow-x-auto">

    <table className="w-full text-left">
      <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
        <tr>
          <th className="px-8 py-5 font-bold">Service</th>
          <th className="px-8 py-5 font-bold">Date</th>
          <th className="px-8 py-5 font-bold">Time</th>
          <th className="px-8 py-5 font-bold">Status</th>
          <th className="px-8 py-5 font-bold text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {bookings.map((booking) => (
          <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-8 py-5">
              <div>
                <span className="font-bold text-slate-800 block">{booking.service?.name}</span>
                <span className="text-xs text-slate-400">{booking.service?.business?.name}</span>
              </div>
            </td>
            <td className="px-8 py-5 text-slate-600 font-medium">
              {formatDate(booking.startTime)}
            </td>
            <td className="px-8 py-5 text-slate-600">
              {formatTime(booking.startTime)}
            </td>
            <td className="px-8 py-5">
              <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${STATUS_STYLES[booking.status] || 'bg-slate-100 text-slate-600'}`}>
                {booking.status}
              </span>
            </td>
            <td className="px-8 py-5 text-right">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onView(booking)}
                  className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  View
                </button>
                {booking.status === 'AWAITING_PAYMENT' && (
                  <button
                    onClick={() => onPay(booking.id)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:shadow-md transition-all animate-pulse"
                  >
                    Pay Now
                  </button>
                )}
                {booking.payment?.invoice && (
                  <button
                    onClick={() => downloadInvoiceFile(booking.payment.invoice.pdfUrl)}
                    className="p-1.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    title="Download Invoice"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </button>
                )}
                {isReschedulable(booking) && (

                  <button
                    onClick={() => onReschedule(booking)}
                    className="px-3 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    Reschedule
                  </button>
                )}
                {isCancellable(booking) && (
                  <button
                    onClick={() => onCancel(booking.id)}
                    disabled={cancelling}
                    className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
};


/** MODAL FOR RESCHEDULING - Mini version of Book.jsx */
const RescheduleModal = ({ booking, token, onClose, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSlots = useCallback(async (date) => {
    const dateStr = date.toISOString().split('T')[0];
    setLoadingSlots(true);
    try {
      const res = await api.get(
        `/availability/slots?businessId=${booking.service.businessId}&serviceId=${booking.serviceId}&startDate=${dateStr}&endDate=${dateStr}`
      );
      setSlots(res.data.data || res.data || {});
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  }, [booking.service.businessId, booking.serviceId]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
      setSelectedSlot(null);
    }
  }, [selectedDate, fetchSlots]);

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setSaving(true);
    try {
      const res = await api.patch(`/appointments/${booking.id}/reschedule`, {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        staffId: selectedSlot.staffId
      });

      onSuccess(res.data.data || res.data);
      alert("Booking rescheduled successfully!");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to reschedule.";
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Reschedule Appointment</h3>
            <p className="text-xs text-slate-500">Pick a new time for {booking.service?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Simple Date Input for Reschedule (Easier than full calendar in modal) */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Select New Date</label>
            <input 
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
          </div>

          {selectedDate && (
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Available Slots</label>
              {loadingSlots ? (
                 <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                 </div>
              ) : (
                <>
                  {/* Group slots by staff */}
                  {(() => {
                    const daySlots = Object.values(slots).flat();
                    const groups = {};
                    daySlots.forEach(slot => {
                      const staffName = slot.staffName || 'Staff Member';
                      if (!groups[staffName]) groups[staffName] = [];
                      groups[staffName].push(slot);
                    });

                    return Object.entries(groups).map(([staffName, staffSlots]) => (
                      <div key={staffName} className="space-y-4 pb-8 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-blue-100">
                            {staffName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Service Provider</p>
                            <p className="text-base font-black text-slate-800 uppercase tracking-tight leading-none">{staffName}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                          {staffSlots.map((slot, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-3.5 rounded-2xl text-xs font-black transition-all border-2 ${
                                selectedSlot?.startTime === slot.startTime && selectedSlot?.staffId === slot.staffId
                                ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200 scale-105" 
                                : "bg-white text-slate-600 border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                              }`}
                            >
                              {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </button>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                  {Object.values(slots).flat().length === 0 && (
                    <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-sm text-slate-400 font-bold italic">No availability found for this day.</p>
                      <p className="text-[10px] text-slate-300 uppercase mt-1">Try selecting a different date</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
           <button
             disabled={!selectedSlot || saving}
             onClick={handleReschedule}
             className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
           >
             {saving ? "Updating..." : "Confirm Reschedule"}
           </button>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
