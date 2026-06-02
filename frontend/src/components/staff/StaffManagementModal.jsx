import { useState } from "react";
import StaffServiceAssignment from "./StaffServiceAssignment";
import StaffScheduleEditor from "./StaffScheduleEditor";

const StaffManagementModal = ({ staff, services = [], onClose }) => {
    const [activeTab, setActiveTab] = useState("services");

    if (!staff) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Manage: {staff.name}</h2>
                        <p className="text-slate-500 text-sm">{staff.email}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        ✕
                    </button>
                </div>

                <div className="px-6 flex border-b bg-white">
                    {["services", "schedule"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 px-6 font-semibold capitalize border-b-2 ${
                                activeTab === tab
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-500"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === "services" && (
                        <StaffServiceAssignment staff={staff} services={services} />
                    )}
                    {activeTab === "schedule" && <StaffScheduleEditor staff={staff} />}
                </div>
            </div>
        </div>
    );
};

export default StaffManagementModal;
