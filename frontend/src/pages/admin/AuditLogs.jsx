import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterAction) params.append("action", filterAction);
      if (filterEntity) params.append("entityType", filterEntity);
      const res = await api.get(`/audit?${params.toString()}`);
      setLogs(res.data.logs || res.data.data?.logs || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterEntity]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Audit Logs</h1>
        <p className="text-slate-500 mt-1">Track admin actions: service edits, cancellations, and more.</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="">All actions</option>
          <option value="SERVICE_CREATE">Service create</option>
          <option value="SERVICE_UPDATE">Service update</option>
          <option value="SERVICE_DELETE">Service delete</option>
          <option value="SERVICE_TOGGLE">Service toggle</option>
          <option value="BOOKING_CANCEL">Booking cancel</option>
          <option value="BOOKING_STATUS_UPDATE">Status update</option>
          <option value="BOOKING_RESCHEDULE">Reschedule</option>
          <option value="BUSINESS_PROFILE_UPDATE">Profile update</option>
          <option value="BUSINESS_HOURS_UPDATE">Hours update</option>
          <option value="BOOKING_CONFIG_UPDATE">Booking config</option>
          <option value="LEAVE_REQUEST_STATUS_UPDATE">Leave request</option>
        </select>
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="">All entities</option>
          <option value="SERVICE">Service</option>
          <option value="BOOKING">Booking</option>
          <option value="BUSINESS">Business</option>
          <option value="TIME_OFF">Time off</option>
        </select>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">When</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {log.entityType} <span className="text-slate-400 text-xs">({log.entityId.slice(0, 8)}…)</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{log.actorRole}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details).slice(0, 80) : "—"}
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

export default AuditLogs;
