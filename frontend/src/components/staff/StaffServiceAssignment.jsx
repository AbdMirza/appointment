import { useState, useEffect } from "react";

const StaffServiceAssignment = ({ staff, services, token, onUpdate }) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (staff && staff.services) {
            setSelectedIds(staff.services.map(s => s.id));
        }
    }, [staff]);

    const toggleService = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`http://localhost:5000/api/users/${staff.id}/services`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ serviceIds: selectedIds })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Services assigned successfully");
                if (onUpdate) onUpdate();
            } else {
                alert(data.message || "Failed to assign services");
            }
        } catch (err) {
            console.error("Error assigning services:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700">Assigned Services</h3>
            <p className="text-sm text-slate-500">Select which services this staff member is qualified to perform.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                {services.map((service) => (
                    <label
                        key={service.id}
                        className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedIds.includes(service.id)
                                ? "border-blue-500 bg-blue-50"
                                : "border-slate-100 hover:border-blue-200"
                            }`}
                    >
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={selectedIds.includes(service.id)}
                            onChange={() => toggleService(service.id)}
                        />
                        <div className="flex-1">
                            <div className="font-bold text-slate-800">{service.name}</div>
                            <div className="text-xs text-slate-500">{service.duration} mins • ${service.price}</div>
                        </div>
                        {selectedIds.includes(service.id) && (
                            <div className="bg-blue-500 text-white rounded-full p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </label>
                ))}
                {services.length === 0 && <p className="text-slate-400 italic">No services available. Create services first.</p>}
            </div>

            <div className="pt-4 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-200"
                >
                    {saving ? "Saving..." : "Save Assignments"}
                </button>
            </div>
        </div>
    );
};

export default StaffServiceAssignment;
