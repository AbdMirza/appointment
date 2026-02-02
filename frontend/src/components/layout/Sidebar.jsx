import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const baseClass =
    "block px-4 py-2 rounded transition";

  const activeClass =
    "bg-slate-800 text-white";

  const inactiveClass =
    "text-slate-300 hover:bg-slate-800 hover:text-white";

  return (
    <div className="w-64 min-h-screen bg-slate-900 p-6 flex flex-col">
      <h1 className="text-xl font-bold mb-10 text-center text-white border-b border-slate-700 pb-4">
        {user?.businessName || "Appointment App"}
      </h1>

      <nav className="space-y-2">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass
            }`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/appointments"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass
            }`
          }
        >
          Appointments
        </NavLink>

        <NavLink
          to="/admin/services"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass
            }`
          }
        >
          Services
        </NavLink>

        <NavLink
          to="/admin/staff"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass
            }`
          }
        >
          Staff
        </NavLink>

        <NavLink
          to="/admin/business-profile"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass
            }`
          }
        >
          Business Profile
        </NavLink>
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-700">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-2 text-red-400 hover:bg-slate-800 hover:text-white rounded transition font-semibold group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 group-hover:scale-110 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
