import React, { useState, useEffect } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import api from "../../api/axios";

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

const CANCEL_OPTIONS = [
    { value: 1, label: "1 hour" },
    { value: 2, label: "2 hours" },
    { value: 4, label: "4 hours" },
    { value: 8, label: "8 hours" },
    { value: 12, label: "12 hours" },
    { value: 24, label: "24 hours" },
    { value: 48, label: "48 hours" },
    { value: 72, label: "3 days" },
];

const RESCHEDULE_OPTIONS = [
    { value: 1, label: "1 hour" },
    { value: 2, label: "2 hours" },
    { value: 4, label: "4 hours" },
    { value: 8, label: "8 hours" },
    { value: 12, label: "12 hours" },
    { value: 24, label: "24 hours" },
    { value: 48, label: "48 hours" },
];

const BookingSettings = () => {
    const { business, setData } = useAdminData();
    const [config, setConfig] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    useEffect(() => {
        if (business?.bookingConfig) {
            setConfig(business.bookingConfig);
        }
    }, [business]);

    const handleSave = async () => {
        if (!config) return;

        setSaving(true);
        setSaveMessage("");
        try {
            const res = await api.put("/availability/config", {
                slotInterval: config.slotInterval,
                minBookingNotice: config.minBookingNotice,
                maxBookingWindow: config.maxBookingWindow,
                cancellationDeadline: config.cancellationDeadline,
                rescheduleDeadline: config.rescheduleDeadline,
                lateCancelPolicy: config.lateCancelPolicy,
            });

            const updatedConfig = res.data.data || res.data;
            
            // Update global state
            setData(prev => ({
                ...prev,
                business: { ...prev.business, bookingConfig: updatedConfig }
            }));

            setSaveMessage("Settings saved successfully!");
            setTimeout(() => setSaveMessage(""), 3000);
        } catch (error) {
            setSaveMessage(error.response?.data?.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Booking Settings</h1>
                    <p className="text-slate-500">Configure how customers can book appointments with your business.</p>
                </div>

                <div className="space-y-6">
                    {/* Slot Interval */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-1">Slot Interval</h3>
                        <p className="text-sm text-slate-500 mb-4">How frequently time slots are generated.</p>
                        <select
                            value={config?.slotInterval || 15}
                            onChange={(e) => setConfig({ ...config, slotInterval: parseInt(e.target.value) })}
                            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                        >
                            {INTERVAL_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Min Booking Notice */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-1">Minimum Booking Notice</h3>
                        <p className="text-sm text-slate-500 mb-4">How far in advance customers must book.</p>
                        <select
                            value={config?.minBookingNotice || 120}
                            onChange={(e) => setConfig({ ...config, minBookingNotice: parseInt(e.target.value) })}
                            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                        >
                            {NOTICE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Max Booking Window */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-1">Maximum Booking Window</h3>
                        <p className="text-sm text-slate-500 mb-4">How far into the future customers can book.</p>
                        <select
                            value={config?.maxBookingWindow || 30}
                            onChange={(e) => setConfig({ ...config, maxBookingWindow: parseInt(e.target.value) })}
                            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                        >
                            {WINDOW_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-1">Cancellation Deadline</h3>
                            <p className="text-sm text-slate-500 mb-4">Must cancel at least X hours before.</p>
                            <select
                                value={config?.cancellationDeadline || 24}
                                onChange={(e) => setConfig({ ...config, cancellationDeadline: parseInt(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                            >
                                {CANCEL_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-1">Reschedule Deadline</h3>
                            <p className="text-sm text-slate-500 mb-4">Must reschedule at least X hours before.</p>
                            <select
                                value={config?.rescheduleDeadline || 12}
                                onChange={(e) => setConfig({ ...config, rescheduleDeadline: parseInt(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                            >
                                {RESCHEDULE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-1">Late Cancellation Behavior</h3>
                        <p className="text-sm text-slate-500 mb-4">What happens when a customer cancels after the deadline?</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <label className={`flex-1 flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${config?.lateCancelPolicy === 'BLOCK' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}>
                                <input type="radio" name="lateCancelPolicy" value="BLOCK" checked={config?.lateCancelPolicy === 'BLOCK'} onChange={(e) => setConfig({ ...config, lateCancelPolicy: e.target.value })} className="hidden" />
                                <span className="font-bold text-slate-800">Block Cancellation</span>
                            </label>
                            <label className={`flex-1 flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${config?.lateCancelPolicy === 'ALLOW_LATE_MARK' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}>
                                <input type="radio" name="lateCancelPolicy" value="ALLOW_LATE_MARK" checked={config?.lateCancelPolicy === 'ALLOW_LATE_MARK'} onChange={(e) => setConfig({ ...config, lateCancelPolicy: e.target.value })} className="hidden" />
                                <span className="font-bold text-slate-800">Allow & Mark Late</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-10 rounded-2xl shadow-xl transition-all disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Settings"}
                    </button>
                    {saveMessage && <p className="text-sm font-medium text-green-600">{saveMessage}</p>}
                </div>
            </div>
        </div>
    );
};

export default BookingSettings;
