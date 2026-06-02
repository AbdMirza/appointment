import React, { useState } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import StaffManagementModal from "../../components/staff/StaffManagementModal";
import api from "../../api/axios";

const Staff = () => {
  const { staff: staffList, services, setData } = useAdminData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "" });
  const [selectedStaff, setSelectedStaff] = useState(null); // For Managing detailed info

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newStaff, role: "STAFF" };
      const res = await api.post("/users", payload);
      const createdStaff = res.data.staff || res.data;
      
      setData(prev => ({
        ...prev,
        staff: [...prev.staff, createdStaff]
      }));
      
      setNewStaff({ name: "", email: "", password: "" });
      setShowAddForm(false);
      alert("Staff added!");
    } catch (err) {
      console.error("Error adding staff:", err);
      alert(err.response?.data?.message || "Failed to add staff");
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;
    try {
      await api.delete(`/users/${id}`);
      setData(prev => ({
        ...prev,
        staff: prev.staff.filter(s => s.id !== id)
      }));
    } catch (err) {
      console.error("Error removing staff:", err);
      alert(err.response?.data?.message || "Failed to remove staff");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/users/${id}`, { isActive: !currentStatus });
      setData(prev => ({
        ...prev,
        staff: prev.staff.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s)
      }));
    } catch (err) {
      console.error("Error toggling status:", err);
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold shadow"
        >
          {showAddForm ? "Cancel" : "+ Add Staff Member"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddStaff} className="bg-white p-6 rounded-xl shadow-md mb-8 border border-blue-100 max-w-2xl">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">New Staff Registration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newStaff.password}
              onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
              required
            />
            <button type="submit" className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 font-bold transition">
              Register Staff
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map((staff) => (
          <div key={staff.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{staff.name}</h3>
                <p className="text-slate-500 text-sm">{staff.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                    STAFF
                  </span>
                  <span className={`inline-block text-xs font-bold px-2 py-1 rounded ${staff.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {staff.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleToggleStatus(staff.id, staff.isActive)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition group border ${staff.isActive
                    ? "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 hover:border-amber-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200"
                    }`}
                >
                  <span className="text-sm font-semibold">{staff.isActive ? "Deactivate" : "Activate"}</span>
                </button>

                <button
                  onClick={() => setSelectedStaff(staff)}
                  className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition group border border-blue-100 hover:border-blue-200"
                >
                  <span className="text-sm font-semibold">Manage</span>
                </button>

                <button
                  onClick={() => handleDeleteStaff(staff.id)}
                  className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition group border border-red-100 hover:border-red-200"
                >
                  <span className="text-sm font-semibold">Remove</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {staffList.length === 0 && (
          <p className="text-slate-500 col-span-full text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
            No staff members found for your business.
          </p>
        )}
      </div>

      {selectedStaff && (
        <StaffManagementModal
          staff={selectedStaff}
          services={services}
          onClose={() => setSelectedStaff(null)}
        />
      )}
    </div>
  );
};

export default Staff;
