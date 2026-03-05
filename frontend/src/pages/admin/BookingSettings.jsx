import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api";

const INTERVAL_OPTIONS = [
    { value: 5, label: "5 minutes" },
    { value: 10, label: "10 minutes" },
    { value: 15, label: "15 minutes" },
    { value: 20, label: "20 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
];

const NOTICE_OPTIONS = [
    { value: 0, label: "No minimum" },
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 120, label: "2 hours" },
    { value: 240, label: "4 hours" },
    { value: 480, label: "8 hours" },
    { value: 1440, label: "24 hours" },
    { value: 2880, label: "48 hours" },
];

const WINDOW_OPTIONS = [
    { value: 7, label: "7 days" },
    { value: 14, label: "14 days" },
    { value: 30, label: "30 days" },
    { value: 60, label: "60 days" },
    { value: 90, label: "90 days" },
];

const BookingSettings = () => {
    const { token } = useAuth();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    const fetchConfig = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/availability/config`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(data.data || data);
            }
        } catch (error) {
            console.error("Error fetching config:", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const handleSave = async () => {
        if (!config) return;

        setSaving(true);
        setSaveMessage("");
        try {
            const res = await fetch(`${API_URL}/availability/config`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    slotInterval: config.slotInterval,
                    minBookingNotice: config.minBookingNotice,
                    maxBookingWindow: config.maxBookingWindow,
                }),
            });

            if (res.ok) {
                setSaveMessage("Settings saved successfully!");
                setTimeout(() => setSaveMessage(""), 3000);
            } else {
                const data = await res.json();
                setSaveMessage(data.message || "Failed to save settings");
            }
        } catch (error) {
            setSaveMessage("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Booking Settings</h1>
                    <p className="text-slate-500">Configure how customers can book appointments with your business.</p>
                </div>

                {/* Settings Cards */}
                <div className="space-y-6">

                    {/* Slot Interval */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 mb-1">Slot Interval</h3>
                                <p className="text-sm text-slate-500 mb-4">How frequently time slots are generated. A 15-minute interval means slots at 10:00, 10:15, 10:30, etc.</p>
                                <select
                                    value={config?.slotInterval || 15}
                                    onChange={(e) => setConfig({ ...config, slotInterval: parseInt(e.target.value) })}
                                    className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                >
                                    {INTERVAL_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Min Booking Notice */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 mb-1">Minimum Booking Notice</h3>
                                <p className="text-sm text-slate-500 mb-4">How far in advance customers must book. A 2-hour notice means bookings can't be made for the next 2 hours.</p>
                                <select
                                    value={config?.minBookingNotice || 120}
                                    onChange={(e) => setConfig({ ...config, minBookingNotice: parseInt(e.target.value) })}
                                    className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                >
                                    {NOTICE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Max Booking Window */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800 mb-1">Maximum Booking Window</h3>
                                <p className="text-sm text-slate-500 mb-4">How far into the future customers can book. A 30-day window means bookings up to 30 days from now.</p>
                                <select
                                    value={config?.maxBookingWindow || 30}
                                    onChange={(e) => setConfig({ ...config, maxBookingWindow: parseInt(e.target.value) })}
                                    className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                >
                                    {WINDOW_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        {saving ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </div>
                        ) : (
                            "Save Settings"
                        )}
                    </button>

                    {saveMessage && (
                        <p className={`text-sm font-medium animate-in fade-in ${saveMessage.includes("success") ? "text-green-600" : "text-red-500"
                            }`}>
                            {saveMessage}
                        </p>
                    )}
                </div>

                {/* Info Box */}
                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">How slot generation works</p>
                            <p className="text-blue-700">
                                Slots are generated based on each staff member's working hours, the service duration (including buffers),
                                and existing bookings. If a staff member is on approved leave or already booked, their slots won't appear.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingSettings;
