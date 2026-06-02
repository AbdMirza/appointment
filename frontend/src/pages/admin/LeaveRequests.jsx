import React from "react";
import { useAdminData } from "../../context/AdminDataContext";
import api from "../../api/axios";

const LeaveRequests = () => {
    const { leaveRequests: requests, setData } = useAdminData();

    const handleStatusUpdate = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return;

        try {
            const res = await api.patch(`/users/time-off/${id}/status`, { status });
            const updated = res.data.data || res.data;
            setData((prev) => ({
                ...prev,
                leaveRequests: prev.leaveRequests.map((r) =>
                    r.id === id ? { ...r, ...updated, user: updated.user || r.user } : r
                ),
            }));
        } catch (err) {
            console.error("Error updating leave status:", err);
            alert(err.response?.data?.message || "Failed to update status");
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Staff Leave Requests</h1>
                <p className="text-slate-500 mt-1">Review and manage staff vacation and sick leave requests.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Staff</th>
                                <th className="px-6 py-4">Dates</th>
                                <th className="px-6 py-4">Reason</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!requests?.length ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No leave requests found.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-semibold">{req.user?.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(req.startDate).toLocaleDateString()} –{" "}
                                            {new Date(req.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{req.reason || "—"}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-bold ${
                                                    req.status === "APPROVED"
                                                        ? "bg-green-100 text-green-800"
                                                        : req.status === "DECLINED"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-amber-100 text-amber-800"
                                                }`}
                                            >
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.status === "PENDING" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(req.id, "APPROVED")}
                                                        className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(req.id, "DECLINED")}
                                                        className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaveRequests;
