import { useState, useEffect, useCallback } from "react";

const StaffTimeOffManager = ({ staff, token }) => {
    const [timeOffList, setTimeOffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTimeOff, setNewTimeOff] = useState({ startDate: "", endDate: "", reason: "" });

    const fetchTimeOff = useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/${staff.id}/time-off`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setTimeOffList(data || []);
            }
        } catch (err) {
            console.error("Error fetching time-off:", err);
        } finally {
            setLoading(false);
        }
    }, [staff.id, token]);

    useEffect(() => {
        fetchTimeOff();
    }, [fetchTimeOff]);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/api/users/${staff.id}/time-off`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newTimeOff)
            });
            if (res.ok) {
                setNewTimeOff({ startDate: "", endDate: "", reason: "" });
                fetchTimeOff();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to add time off");
            }
        } catch (err) {
            console.error("Error adding time off:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this time off entry?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/users/time-off/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchTimeOff();
            }
        } catch (err) {
            console.error("Error deleting time off:", err);
        }
    };

    if (loading) return <p>Loading time off...</p>;

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Add Time Off</h3>
                <form onSubmit={handleAdd} className="bg-slate-50 p-6 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                        <input
                            type="date"
                            required
                            value={newTimeOff.startDate}
                            onChange={(e) => setNewTimeOff({ ...newTimeOff, startDate: e.target.value })}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">End Date</label>
                        <input
                            type="date"
                            required
                            value={newTimeOff.endDate}
                            onChange={(e) => setNewTimeOff({ ...newTimeOff, endDate: e.target.value })}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Reason (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g., Vacation"
                            value={newTimeOff.reason}
                            onChange={(e) => setNewTimeOff({ ...newTimeOff, reason: e.target.value })}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button type="submit" className="md:col-span-3 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
                        Add Time Off Entry
                    </button>
                </form>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Upcoming Time Off</h3>
                <div className="space-y-2">
                    {timeOffList.map((entry) => (
                        <div key={entry.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 hover:border-blue-100 transition shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800">
                                        {new Date(entry.startDate).toLocaleDateString()} - {new Date(entry.endDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ring-1 ${entry.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' :
                                            entry.status === 'DECLINED' ? 'bg-red-50 text-red-600 ring-red-100' :
                                                'bg-amber-50 text-amber-600 ring-amber-100'
                                            }`}>
                                            {entry.status}
                                        </span>
                                        <span className="text-sm text-slate-500">• {entry.reason || "No reason provided"}</span>
                                    </div>
                                </div>
                            </div>
                            {entry.status === 'PENDING' && (
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="text-red-400 hover:text-red-600 p-2 transition-colors"
                                    title="Withdraw Request"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2h1v9a2 2 0 002 2h6a2 2 0 002-2V6h1a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM8 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                    {timeOffList.length === 0 && <p className="text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">No time off booked.</p>}
                </div>
            </div>
        </div>
    );
};

export default StaffTimeOffManager;
