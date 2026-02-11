import { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

const Staff = () => {
  const { token } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "" });

  // Fetch staff list
  const fetchStaff = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/users/staff", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStaffList(data);
      } else {
        console.error("Failed to fetch staff:", data.message);
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [token]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    // send request to add staff
    try {
      const res = await fetch("http://localhost:5000/api/users/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newStaff)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Staff added!");
        setStaffList([...staffList, data.staff]); // Backend returns { message, staff }
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
      const res = await fetch(`http://localhost:5000/api/users/staff/${id}`, {
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
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded mt-2">
                      STAFF
                    </span>
                  </div>
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
                    <span className="text-sm font-semibold">Remove Staff</span>
                  </button>
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
    </div>
  );
};

export default Staff;
