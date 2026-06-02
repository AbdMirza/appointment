import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";
import CalendarView from "../../components/admin/CalendarView";
import { List, Calendar, X, User, Clock, Briefcase, Phone, Mail, CheckCircle, XCircle, ChevronRight, AlertCircle, MessageSquare, Bell } from "lucide-react";
import api from "../../api/axios";

import { useAdminData } from "../../context/AdminDataContext";

const Appointments = () => {
  const { user, pendingCount, setPendingCount } = useAuth();
  const { staff: staffList = [], services: serviceList = [], setData } = useAdminData();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [currentRange, setCurrentRange] = useState({ start: null, end: null });
  const [isAdminOverride, setIsAdminOverride] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedService, setSelectedService] = useState("");

  const fetchStaffAvailability = useCallback(async (appointment) => {
    if (!appointment) return;
    try {
      setCheckingAvailability(true);
      const res = await api.get(`/users/available/for-slot?startTime=${appointment.startTime}&endTime=${appointment.endTime}&excludeBookingId=${appointment.id}`);
      setAvailableStaff(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching availability:", err);
    } finally {
      setCheckingAvailability(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAppointment) {
      fetchStaffAvailability(selectedAppointment);
    } else {
      setAvailableStaff([]);
    }
  }, [selectedAppointment, fetchStaffAvailability]);

  const fetchAppointments = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (params.tab) queryParams.append('tab', params.tab);
      else if (activeTab !== 'all' && viewMode === 'list') queryParams.append('tab', activeTab);

      if (params.startDate) queryParams.append('startDate', params.startDate.toISOString());
      if (params.endDate) queryParams.append('endDate', params.endDate.toISOString());
      
      if (selectedStaff) queryParams.append('staffId', selectedStaff);
      if (selectedService) queryParams.append('serviceId', selectedService);

      const res = await api.get(`/appointments/business?${queryParams.toString()}`);
      setAppointments(res.data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, viewMode, selectedStaff, selectedService]);

  // Handle Range Change from Calendar
  const handleRangeChange = useCallback((start, end) => {
    // Only update the state. The useEffect below will handle the actual fetch.
    setCurrentRange({ start, end });
  }, []);

  // Re-fetch when switching to list mode or changing tab
  useEffect(() => {
    if (viewMode === 'list') {
      fetchAppointments({ tab: activeTab });
    } else if (currentRange.start && currentRange.end) {
      fetchAppointments({ startDate: currentRange.start, endDate: currentRange.end });
    }
  }, [viewMode, activeTab, fetchAppointments, currentRange.start, currentRange.end, selectedStaff, selectedService]);

  const updateStatus = async (id, status, extraData = {}) => {
    try {
      const body = { status, ...extraData };

      const res = await api.patch(`/appointments/${id}/status`, body);
      const data = res.data;
      
      // Refresh local data
      if (viewMode === 'calendar') {
        fetchAppointments({ startDate: currentRange.start, endDate: currentRange.end });
      } else {
        fetchAppointments({ tab: activeTab });
      }
      
      // Refresh pending count badge immediately if admin
      if (user?.role === "BUSINESS_ADMIN") {
        setPendingCount((c) => Math.max(0, c - (selectedAppointment?.status === "PENDING" ? 1 : 0)));
        setData((prev) => prev?.stats ? ({
          ...prev,
          stats: { ...prev.stats, pendingCount: Math.max(0, (prev.stats.pendingCount || 0) - 1) },
        }) : prev);
      }

      // Update selected appointment if modal is open
      if (selectedAppointment && selectedAppointment.id === id) {
        setSelectedAppointment(data.data || data.appointment || data);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      const errorMsg = err.response?.data?.message || "Error updating status";
      alert(errorMsg);
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await api.patch(`/appointments/${id}/cancel`, { isAdminOverride });
      const data = res.data;
      
      if (viewMode === 'calendar') {
        fetchAppointments({ startDate: currentRange.start, endDate: currentRange.end });
      } else {
        fetchAppointments({ tab: activeTab });
      }
      if (user?.role === "BUSINESS_ADMIN") {
        setPendingCount((c) => Math.max(0, c - 1));
        setData((prev) => prev?.stats ? ({
          ...prev,
          stats: { ...prev.stats, pendingCount: Math.max(0, (prev.stats.pendingCount || 0) - 1) },
        }) : prev);
      }
      if (selectedAppointment?.id === id) {
        setSelectedAppointment(data.data || data);
      }
      alert(data.message || "Booking cancelled successfully.");
    } catch (err) {
      console.error("Error cancelling:", err);
      const errorMsg = err.response?.data?.message || "Error cancelling booking";
      alert(errorMsg);
    }
  };

  const handleAssign = (id, staffId) => {
    if (!staffId) return;
    updateStatus(id, "ASSIGNED", { staffId });
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

  const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'all', label: 'All' }
  ];

  return (
    <div className={user?.role === "BUSINESS_ADMIN" ? "" : "flex bg-slate-50 min-h-screen"}>
      {user?.role !== "BUSINESS_ADMIN" && <Sidebar />}

      <div className={user?.role === "BUSINESS_ADMIN" ? "p-8 w-full" : "flex-1 p-8 max-w-[1600px] mx-auto w-full"}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Appointments</h1>
              {user?.role === "BUSINESS_ADMIN" && pendingCount > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-black rounded-full shadow-lg shadow-red-200 animate-pulse">
                  <Bell size={12} />
                  {pendingCount} new
                </span>
              )}
            </div>
            <p className="text-slate-500 mt-1 font-medium">
              {user?.role === "BUSINESS_ADMIN"
                ? "Oversee and organize all bookings across your business."
                : "Your personal schedule and assigned clients."}
            </p>
          </div>

          <div className="flex items-center bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Calendar size={18} />
              Calendar
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <List size={18} />
              List View
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        {user?.role === "BUSINESS_ADMIN" && (
          <div className="flex flex-wrap items-center gap-4 mb-8 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Filters:</span>
            </div>
            
            <div className="flex-1 max-w-xs relative">
              <select 
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 appearance-none focus:ring-4 focus:ring-blue-500/10 focus:outline-none cursor-pointer"
              >
                <option value="">All Staff Members</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>

            <div className="flex-1 max-w-xs relative">
              <select 
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 appearance-none focus:ring-4 focus:ring-blue-500/10 focus:outline-none cursor-pointer"
              >
                <option value="">All Services</option>
                {serviceList.map(service => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>

            {(selectedStaff || selectedService) && (
              <button 
                onClick={() => { setSelectedStaff(""); setSelectedService(""); }}
                className="flex items-center gap-2 px-4 py-2 text-rose-600 font-bold text-sm hover:bg-rose-50 rounded-xl transition-all"
              >
                <X size={16} />
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* View Content */}
        {viewMode === 'calendar' ? (
          <CalendarView 
            appointments={appointments} 
            loading={loading}
            onRangeChange={handleRangeChange}
            onAppointmentClick={setSelectedAppointment}
          />
        ) : (
          <div className="flex flex-col space-y-6">
            {/* List Tabs */}
            <div className="flex gap-2 bg-slate-200/50 p-1 rounded-2xl w-fit border border-slate-200">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List Table */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-5">Customer</th>
                      <th className="px-6 py-5">Service</th>
                      <th className="px-6 py-5">Date & Time</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5">Provider</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-32 text-center text-slate-400 font-medium">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Syncing data...
                          </div>
                        </td>
                      </tr>
                    ) : appointments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-32 text-center">
                          <div className="flex flex-col items-center opacity-30">
                            <Calendar size={64} className="mb-4 text-slate-300" />
                            <p className="text-xl font-black text-slate-400 italic">No appointments matched your filters.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      appointments.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition-all cursor-pointer group" onClick={() => setSelectedAppointment(app)}>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black text-lg ring-1 ring-slate-300 shadow-sm">
                                {app.user?.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight">{app.user?.name}</p>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 leading-none">
                                    <Mail size={10} /> {app.user?.email}
                                  </p>
                                  {app.phone && (
                                    <p className="text-[10px] font-bold text-blue-500/80 flex items-center gap-1.5 leading-none">
                                      <Phone size={10} /> {app.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-3 py-1 bg-indigo-50/80 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider ring-1 ring-indigo-200/50">
                              {app.service?.name}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-800">{formatDate(app.startTime)}</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">{formatTime(app.startTime)} - {formatTime(app.endTime)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${app.status === 'ASSIGNED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                app.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                  app.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    app.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                      app.status === 'LATE_CANCELLED' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                      app.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                          app.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                          app.status === 'NO_SHOW' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                            'bg-slate-50 text-slate-600 border-slate-100'
                               }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            {app.acceptedBy ? (
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 ring-1 ring-blue-100">
                                  <User size={12} />
                                </div>
                                {app.acceptedBy.name}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right font-black">
                             <div className="flex items-center justify-end gap-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                                VIEW DETAILS <ChevronRight size={16} />
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
        )}

        {/* Appointment Detail Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in transition-all">
            <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl shadow-slate-900/40 overflow-hidden relative border border-slate-100 animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-blue-500/5 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                      selectedAppointment.status === 'PENDING' ? "bg-amber-100 text-amber-700 border-amber-200" : 
                      selectedAppointment.status === 'CONFIRMED' ? "bg-blue-100 text-blue-700 border-blue-200" : 
                      selectedAppointment.status === 'ASSIGNED' ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                      selectedAppointment.status === 'LATE_CANCELLED' ? "bg-orange-100 text-orange-700 border-orange-200" :
                      selectedAppointment.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                      selectedAppointment.status === 'NO_SHOW' ? "bg-slate-200 text-slate-600 border-slate-300" :
                      "bg-slate-100 text-slate-700 border-slate-200"
                    )}>
                      {selectedAppointment.status}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                      ID: {selectedAppointment.id.substring(0, 8)}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    {selectedAppointment.service?.name}
                  </h2>
                </div>
                <button 
                  onClick={() => {
                    setSelectedAppointment(null);
                    setIsAdminOverride(false);
                  }}
                  className="p-3 bg-white hover:bg-slate-100 text-slate-500 rounded-2xl shadow-sm border border-slate-200 transition-all z-20"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  {/* Left Column: Client & Status */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <User size={12} className="text-blue-500" /> Customer Information
                      </h4>
                      <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{selectedAppointment.user?.name}</p>
                      <p className="text-sm font-bold text-slate-500 mt-1">{selectedAppointment.user?.email}</p>
                      {selectedAppointment.phone && (
                        <p className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                          <Phone size={12} className="text-blue-500" /> {selectedAppointment.phone}
                        </p>
                      )}
                    </div>

                    {selectedAppointment.notes && (
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <MessageSquare size={12} className="text-blue-500" /> Customer Notes
                        </h4>
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-slate-700 font-medium">
                          {selectedAppointment.notes}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Clock size={12} className="text-blue-500" /> Scheduled Time
                      </h4>
                      <p className="text-base font-black text-slate-800">{formatDate(selectedAppointment.startTime)}</p>
                      <p className="text-sm font-bold text-slate-500 mt-1 uppercase">
                        {formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}
                      </p>
                    </div>

                    {/* Payment Status Section */}
                    <div className="pt-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <CheckCircle size={12} className="text-blue-500" /> Payment Status
                      </h4>
                      {selectedAppointment.payment ? (
                        <div className="flex items-center gap-3">
                          {selectedAppointment.payment.status === 'PAID' ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 ring-4 ring-emerald-500/5">
                              <CheckCircle size={14} className="animate-pulse" />
                              <span className="text-sm font-black uppercase tracking-tight">Payment Done</span>
                            </div>
                          ) : selectedAppointment.payment.paymentMethod === 'cash' ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 ring-4 ring-blue-500/5">
                              <Briefcase size={14} />
                              <span className="text-sm font-black uppercase tracking-tight">Pay at Business</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 ring-4 ring-amber-500/5">
                              <Clock size={14} className="animate-spin-slow" />
                              <span className="text-sm font-black uppercase tracking-tight">Online Payment Pending</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-slate-400 italic">No payment info available</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Execution */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Briefcase size={12} className="text-blue-500" /> Assigned Staff
                      </h4>
                      {selectedAppointment.acceptedBy ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-lg ring-1 ring-blue-100 shadow-sm">
                            {selectedAppointment.acceptedBy.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase">{selectedAppointment.acceptedBy.name}</p>
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Primary Provider</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 border-dashed flex items-center gap-3 text-amber-700">
                          <AlertCircle size={16} />
                          <span className="text-xs font-black uppercase tracking-tight">Staff Missing</span>
                        </div>
                      )}
                    </div>

                    {user?.role === "BUSINESS_ADMIN" && ["PENDING", "CONFIRMED", "ASSIGNED"].includes(selectedAppointment.status) && (
                      <div className="animate-in">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                          Assign Service To
                          {checkingAvailability && (
                            <span className="flex items-center gap-1 normal-case font-bold text-blue-500">
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                              Checking availability...
                            </span>
                          )}
                        </h4>
                        <div className="relative">
                          <select
                            onChange={(e) => handleAssign(selectedAppointment.id, e.target.value)}
                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:outline-none appearance-none cursor-pointer shadow-inner disabled:opacity-50"
                            value={selectedAppointment.acceptedById || ""}
                            disabled={checkingAvailability}
                          >
                            <option value="" disabled>Select Staff member...</option>
                            {(availableStaff.length > 0 ? availableStaff : staffList).map(staff => {
                              const isCurrentlyAssigned = selectedAppointment.acceptedById === staff.id;
                              return (
                                <option 
                                  key={staff.id} 
                                  value={staff.id}
                                  disabled={staff.isAvailable === false && !isCurrentlyAssigned}
                                  className={staff.isAvailable === false && !isCurrentlyAssigned ? "text-slate-400" : "text-slate-900"}
                                >
                                  {staff.name} {isCurrentlyAssigned ? "(Already Assigned)" : (staff.isAvailable === false ? `(Unavailable: ${staff.reason})` : "")}
                                </option>
                              );
                            })}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                             <ChevronRight size={18} className="rotate-90" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                {/* Footer Actions */}
                <div className="pt-8 border-t border-slate-100 flex flex-wrap gap-3">
                  {/* Admin: Confirm Pending Bookings */}
                  {user?.role === "BUSINESS_ADMIN" && selectedAppointment.status === "PENDING" && (
                    <button
                      onClick={() => updateStatus(selectedAppointment.id, "CONFIRMED")}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                      <CheckCircle size={18} />
                      APPROVE NOW
                    </button>
                  )}

                  {/* Admin: Cancel any active booking */}
                  {user?.role === "BUSINESS_ADMIN" && (selectedAppointment.status === "PENDING" || selectedAppointment.status === "CONFIRMED" || selectedAppointment.status === "ASSIGNED") && (
                    <div className="flex flex-col flex-1 gap-2">
                         <button
                            onClick={() => handleCancel(selectedAppointment.id)}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl text-sm font-black transition-all active:scale-95"
                            >
                            <XCircle size={18} />
                            CANCEL BOOKING
                        </button>
                        <label className="flex items-center gap-2 px-2 cursor-pointer group">
                             <input 
                                type="checkbox" 
                                checked={isAdminOverride}
                                onChange={(e) => setIsAdminOverride(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                             />
                             <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-600 uppercase transition-colors">Admin Policy Override</span>
                        </label>
                    </div>
                  )}

                  {/* Staff Only: Complete a booking that has been assigned and potentially started */}
                  {user?.role === "STAFF" && (selectedAppointment.status === "ASSIGNED" || selectedAppointment.status === "CONFIRMED") && (
                    <button
                      onClick={() => updateStatus(selectedAppointment.id, "COMPLETED")}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-200 transition-all active:scale-95"
                    >
                      <CheckCircle size={18} />
                      MARK COMPLETED
                    </button>
                  )}

                  {/* Admin or Staff: Mark as No-Show */}
                  {(selectedAppointment.status === "ASSIGNED" || selectedAppointment.status === "CONFIRMED") && (
                    <button
                      onClick={() => updateStatus(selectedAppointment.id, "NO_SHOW")}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-sm font-black transition-all active:scale-95 border border-slate-200"
                    >
                      <X size={18} />
                      MARK NO-SHOW
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-in { animation: fadeIn 0.3s ease-out forwards; }
        .zoom-in-95 { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
      `}</style>
    </div>
  );
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default Appointments;

