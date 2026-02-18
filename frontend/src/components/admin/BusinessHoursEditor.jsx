import { useState, useEffect } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const BusinessHoursEditor = ({ token }) => {
    const [hours, setHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchHours();
    }, [token]);

    const fetchHours = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/business/hours", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // If no hours set, initialize defaults
                if (data.length === 0) {
                    setHours(DAYS.map((day, index) => ({
                        dayOfWeek: index,
                        startTime: "09:00",
                        endTime: "17:00",
                        isOpen: true
                    })));
                } else {
                    // Ensure all days are present
                    const fullHours = DAYS.map((day, index) => {
                        const existing = data.find(h => h.dayOfWeek === index);
                        return existing || { dayOfWeek: index, startTime: "09:00", endTime: "17:00", isOpen: false };
                    });
                    setHours(fullHours);
                }
            }
        } catch (err) {
            console.error("Error fetching hours:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (index) => {
        const newHours = [...hours];
        newHours[index].isOpen = !newHours[index].isOpen;
        setHours(newHours);
        setSuccess(false);
    };

    const handleChange = (index, field, value) => {
        const newHours = [...hours];
        newHours[index][field] = value;
        setHours(newHours);
        setSuccess(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);
        try {
            const res = await fetch("http://localhost:5000/api/business/hours", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ hours })
            });
            if (res.ok) {
                setSuccess(true);
            } else {
                alert("Failed to save business hours");
            }
        } catch (err) {
            console.error("Error saving hours:", err);
            alert("Error saving hours");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p className="text-slate-500">Loading hours...</p>;

    return (
        <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 mt-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold">Business Operating Hours</h2>
                    <p className="text-sm text-slate-500">Set the times when your business is open for appointments</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save Hours"}
                </button>
            </div>

            {success && (
                <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg mb-6 text-sm">
                    Hours saved successfully!
                </div>
            )}

            <div className="space-y-4">
                {hours.map((h, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg border border-slate-50 bg-slate-50/30">
                        <div className="w-32">
                            <span className="font-semibold text-slate-700">{DAYS[h.dayOfWeek]}</span>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={h.isOpen}
                                onChange={() => handleToggle(index)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-slate-600">
                                {h.isOpen ? "Open" : "Closed"}
                            </span>
                        </label>

                        {h.isOpen && (
                            <div className="flex items-center gap-2 flex-1 justify-end">
                                <input
                                    type="time"
                                    value={h.startTime}
                                    onChange={(e) => handleChange(index, "startTime", e.target.value)}
                                    className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                />
                                <span className="text-slate-400">to</span>
                                <input
                                    type="time"
                                    value={h.endTime}
                                    onChange={(e) => handleChange(index, "endTime", e.target.value)}
                                    className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                />
                            </div>
                        )}
                        {!h.isOpen && (
                            <div className="flex-1 text-right">
                                <span className="text-slate-400 text-sm italic">Not accepting appointments</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BusinessHoursEditor;
