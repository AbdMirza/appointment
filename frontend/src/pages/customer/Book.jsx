import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Book = () => {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-indigo-100 flex flex-col items-center p-6">

      <div className="w-full max-w-4xl flex justify-between mb-10">
        <Link
          to="/customer/home"
          className="bg-white text-blue-600 px-5 py-2 rounded-xl font-bold shadow hover:bg-blue-50 transition"
        >
          ← Back
        </Link>
        <button
          onClick={logout}
          className="bg-white text-red-600 px-5 py-2 rounded-xl font-bold shadow hover:bg-red-50 transition"
        >
          Logout
        </button>
      </div>
      <div className="bg-white shadow-xl rounded-2xl p-8 sm:p-12 max-w-md w-full">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-gray-800">
          Book an Appointment
        </h1>

        <form className="space-y-5">
          <select className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
            <option>Select Service</option>
            <option>Consultation</option>
            <option>Checkup</option>
          </select>

          <input
            type="date"
            className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <input
            type="time"
            className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md transition">
            Confirm Booking
          </button>
        </form>
      </div>
    </div>
  );
};

export default Book;
