import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { user, logout, pendingCount } = useAuth();

  const baseClass = "block px-4 py-2 rounded transition";
  const activeClass = "bg-slate-800 text-white";
  const inactiveClass = "text-slate-300 hover:bg-slate-800 hover:text-white";

  return (
    <div className="w-64 min-h-screen bg-slate-900 p-6 flex flex-col">
      <h1 className="text-xl font-bold mb-10 text-center text-white border-b border-slate-700 pb-4">
        {user?.businessName || "Appointment App"}
      </h1>

      <nav className="space-y-2">
        {(user?.role === "BUSINESS_ADMIN" || user?.role === "STAFF") && (
          <NavLink
            to={user?.role === "BUSINESS_ADMIN" ? "/admin/dashboard" : "/staff/dashboard"}
            className={({ isActive }) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}
          >
            Dashboard
          </NavLink>
        )}

        {(user?.role === "BUSINESS_ADMIN" || user?.role === "STAFF") && (
          <NavLink
            to={user?.role === "BUSINESS_ADMIN" ? "/admin/appointments" : "/staff/appointments"}
            className={({ isActive }) =>
              `${baseClass} ${isActive ? activeClass : inactiveClass} flex justify-between items-center`
            }
          >
            <span>Appointments</span>
            {user?.role === "BUSINESS_ADMIN" && pendingCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                {pendingCount}
              </span>
            )}
          </NavLink>
        )}

        {user?.role === "BUSINESS_ADMIN" && (
          <>
            <NavLink
              to="/admin/customers"
              className={({ isActive }) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}
            >
              Customers
            </NavLink>

            <NavLink
              to="/admin/services"
              className={({ isActive }) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}
            >
              Services
            </NavLink>

            <NavLink
              to="/admin/staff"
              className={({ isActive }) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}
            >
              Staff
            </NavLink>

            <NavLink
              to="/admin/business-profile"
              className={({ isActive }) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}
            >
              Business Profile
            </NavLink>

            <NavLink
              to="/admin/leave-requests"
              className={({ isActive }) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}
            >
              Leave Requests
            </NavLink>

            <NavLink
              to="/admin/booking-settings"
              className={({ isActive }) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}
            >
              Booking Settings
            </NavLink>

            <NavLink
              to="/admin/finance"
              className={({ isActive }) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}
            >
              Finance Report
            </NavLink>

            <NavLink
              to="/admin/audit-logs"
              className={({ isActive }) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}
            >
              Audit Logs
            </NavLink>

          </>
        )}

        {user?.role === "STAFF" && (
          <NavLink
            to="/staff/time-off"
            className={({ isActive }) => `${baseClass} ${isActive ? activeClass : inactiveClass}`}
          >
            Time Off
          </NavLink>
        )}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-700">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-2 text-red-400 hover:bg-slate-800 hover:text-white rounded transition font-semibold group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-3 group-hover:scale-110 transition"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {/* Fixed logout arrow SVG */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
            />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
