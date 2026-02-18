import { useState, useEffect, useCallback } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const StaffScheduleEditor = ({ staff, token }) => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchSchedule = useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/${staff.id}/schedule`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                const list = Array.isArray(data) ? data : (data.data || []);
                setSchedule(list);
            }
        } catch (err) {
            console.error("Error fetching schedule:", err);
        } finally {
            setLoading(false);
        }
    }, [staff.id, token]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const toggleDay = (dayIndex) => {
        const exists = schedule.find(s => s.dayOfWeek === dayIndex);
        if (exists) {
            setSchedule(schedule.filter(s => s.dayOfWeek !== dayIndex));
        } else {
            setSchedule([...schedule, { dayOfWeek: dayIndex, startTime: "09:00", endTime: "17:00", breakStart: "13:00", breakEnd: "14:00" }]);
        }
    };

    const updateDay = (dayIndex, field, value) => {
        setSchedule(schedule.map(s => s.dayOfWeek === dayIndex ? { ...s, [field]: value } : s));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`http://localhost:5000/api/users/${staff.id}/schedule`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ schedule })
            });
            if (res.ok) {
                alert("Schedule saved successfully");
            } else {
                const data = await res.json();
                alert(data.message || "Failed to save schedule");
            }
        } catch (err) {
            console.error("Error saving schedule:", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p>Loading schedule...</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-700">Weekly Working Hours</h3>
                    <p className="text-sm text-slate-500">Define when this staff member is available for bookings.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save Schedule"}
                </button>
            </div>

            <div className="space-y-3">
                {DAYS.map((dayName, index) => {
                    const dayData = schedule.find(s => s.dayOfWeek === index);
                    const isActive = !!dayData;

                    return (
                        <div key={dayName} className={`p-4 rounded-xl border-2 transition-all ${isActive ? "border-blue-100 bg-white" : "border-slate-50 bg-slate-50 opacity-60"}`}>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="w-32 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={() => toggleDay(index)}
                                        className="w-5 h-5 accent-blue-600"
                                    />
                                    <span className={`font-bold ${isActive ? "text-slate-800" : "text-slate-400"}`}>{dayName}</span>
                                </div>

                                {isActive && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Shift:</span>
                                            <input
                                                type="time"
                                                value={dayData.startTime}
                                                onChange={(e) => updateDay(index, "startTime", e.target.value)}
                                                className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            />
                                            <span className="text-slate-400">to</span>
                                            <input
                                                type="time"
                                                value={dayData.endTime}
                                                onChange={(e) => updateDay(index, "endTime", e.target.value)}
                                                className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 border-l pl-4">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Break:</span>
                                            <input
                                                type="time"
                                                value={dayData.breakStart || ""}
                                                onChange={(e) => updateDay(index, "breakStart", e.target.value)}
                                                className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            />
                                            <span className="text-slate-400">to</span>
                                            <input
                                                type="time"
                                                value={dayData.breakEnd || ""}
                                                onChange={(e) => updateDay(index, "breakEnd", e.target.value)}
                                                className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            />
                                        </div>
                                    </>
                                )}
                                {!isActive && (
                                    <span className="text-sm text-slate-400 italic">Day Off</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StaffScheduleEditor;
