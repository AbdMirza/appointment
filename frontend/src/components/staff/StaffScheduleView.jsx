import { useState, useEffect, useCallback } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const StaffScheduleView = ({ userId, token }) => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSchedule = useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/${userId}/schedule`, {
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
    }, [userId, token]);

    useEffect(() => {
        if (userId && token) {
            fetchSchedule();
        }
    }, [fetchSchedule, userId, token]);

    if (loading) return (
        <div className="flex items-center gap-2 p-4 text-slate-500">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <p className="text-sm">Loading your schedule...</p>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">Your Weekly Schedule</h3>
                <p className="text-xs text-slate-500 mt-1">These are your official working hours as set by the administrator.</p>
            </div>

            <div className="divide-y divide-slate-50">
                {DAYS.map((dayName, index) => {
                    const dayData = schedule.find(s => s.dayOfWeek === index);
                    const isActive = !!dayData;

                    return (
                        <div key={dayName} className={`p-4 flex items-center justify-between ${isActive ? "bg-white" : "bg-slate-50/30"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                                <span className={`font-bold text-sm ${isActive ? "text-slate-700" : "text-slate-400"}`}>{dayName}</span>
                            </div>

                            {isActive ? (
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift</p>
                                        <p className="text-sm font-semibold text-slate-700">{dayData.startTime} - {dayData.endTime}</p>
                                    </div>
                                    {dayData.breakStart && (
                                        <div className="text-center border-l pl-6">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Break</p>
                                            <p className="text-sm font-medium text-slate-500">{dayData.breakStart} - {dayData.breakEnd}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-xs text-slate-400 italic font-medium bg-slate-100 px-3 py-1 rounded-full">Day Off</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {schedule.length === 0 && !loading && (
                <div className="p-8 text-center bg-amber-50 border-t border-amber-100">
                    <p className="text-sm text-amber-700 font-medium">No schedule defined yet. Please contact your manager.</p>
                </div>
            )}
        </div>
    );
};

export default StaffScheduleView;
