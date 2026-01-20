import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const baseClass =
    "block px-4 py-2 rounded transition";

  const activeClass =
    "bg-slate-800 text-white";

  const inactiveClass =
    "text-slate-300 hover:bg-slate-800 hover:text-white";

  return (
    <div className="w-64 min-h-screen bg-slate-900 p-6">
      <h1 className="text-2xl font-bold mb-10 text-center text-white">
        Appointment
      </h1>

      <nav className="space-y-2">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `${baseClass} ${
              isActive ? activeClass : inactiveClass
            }`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/appointments"
          className={({ isActive }) =>
            `${baseClass} ${
              isActive ? activeClass : inactiveClass
            }`
          }
        >
          Appointments
        </NavLink>

        <NavLink
          to="/admin/services"
          className={({ isActive }) =>
            `${baseClass} ${
              isActive ? activeClass : inactiveClass
            }`
          }
        >
          Services
        </NavLink>

        <NavLink
          to="/admin/staff"
          className={({ isActive }) =>
            `${baseClass} ${
              isActive ? activeClass : inactiveClass
            }`
          }
        >
          Staff
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
