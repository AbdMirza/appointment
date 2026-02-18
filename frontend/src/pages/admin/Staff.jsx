import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";
import StaffManagementModal from "../../components/staff/StaffManagementModal";

const Staff = () => {
  const { token } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "" });
  const [selectedStaff, setSelectedStaff] = useState(null); // For Managing detailed info

  // Fetch staff list
  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/users?role=STAFF", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStaffList(data.data || data);
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
    }
  }, [token]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchStaff();
      setLoading(false);
    };
    init();
  }, [fetchStaff]);


  const handleAddStaff = async (e) => {
    e.preventDefault();
    // send request to add staff
    try {
      const payload = { ...newStaff, role: "STAFF" }; // Ensure role is sent
      const res = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Staff added!");
        // Backend returns raw record now, was { staff: ... }
        const createdStaff = data.staff || data;
        setStaffList([...staffList, createdStaff]);
        setNewStaff({ name: "", email: "", password: "" });
        setShowAddForm(false);
      } else {

        alert(data.message || "Failed to add staff");
      }
    } catch (err) {
      console.error("Error adding staff:", err);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStaffList(staffList.filter(s => s.id !== id));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to remove staff");
      }
    } catch (err) {
      console.error("Error removing staff:", err);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        setStaffList(staffList.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };


  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8">
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

        {loading ? (
          <p>Loading staff...</p>
        ) : (
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
                      title={staff.isActive ? "Deactivate Staff" : "Activate Staff"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-semibold">{staff.isActive ? "Deactivate" : "Activate"}</span>
                    </button>

                    <button
                      onClick={() => setSelectedStaff(staff)}
                      className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition group border border-blue-100 hover:border-blue-200"
                      title="Manage Staff"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <span className="text-sm font-semibold">Manage</span>
                    </button>

                    <button


                      onClick={() => handleDeleteStaff(staff.id)}
                      className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition group border border-red-100 hover:border-red-200"
                      title="Remove Staff"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 transform group-hover:scale-110 transition-transform"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2h1v9a2 2 0 002 2h6a2 2 0 002-2V6h1a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM8 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-semibold">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {staffList.length === 0 && !loading && (
              <p className="text-slate-500 col-span-full text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                No staff members found for your business.
              </p>
            )}
          </div>
        )}
      </div>

      {selectedStaff && (
        <StaffManagementModal
          staff={selectedStaff}
          token={token}
          onClose={() => setSelectedStaff(null)}
          onUpdate={fetchStaff}
        />
      )}
    </div>
  );
};

export default Staff;
