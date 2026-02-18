import { useState, useEffect } from "react";
import StaffServiceAssignment from "./StaffServiceAssignment";
import StaffScheduleEditor from "./StaffScheduleEditor";
const StaffManagementModal = ({ staff, onClose, token, onUpdate }) => {
    const [activeTab, setActiveTab] = useState("services");
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);

    useEffect(() => {
        const fetchServices = async () => {
            setLoadingServices(true);
            try {
                const res = await fetch("http://localhost:5000/api/services", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setServices(data.data || data);
                }
            } catch (err) {
                console.error("Error fetching services:", err);
            } finally {
                setLoadingServices(false);
            }
        };

        if (staff) {
            fetchServices();
        }
    }, [staff, token]);

    if (!staff) return null;


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Manage: {staff.name}</h2>
                        <p className="text-slate-500 text-sm">{staff.email}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 flex border-b bg-white">
                    {["services", "schedule"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 px-6 font-semibold capitalize transition-colors border-b-2 ${activeTab === tab
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {loadingServices ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === "services" && (
                                <StaffServiceAssignment staff={staff} services={services} token={token} onUpdate={onUpdate} />
                            )}
                            {activeTab === "schedule" && (
                                <StaffScheduleEditor staff={staff} token={token} />
                            )}
                        </>
                    )}
                </div>


                {/* Footer */}
                <div className="p-4 border-t bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-300 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffManagementModal;
