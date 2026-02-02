import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Home = () => {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-indigo-100 flex flex-col items-center p-6">

      <div className="w-full max-w-4xl flex justify-end mb-10">
        <button
          onClick={logout}
          className="bg-white text-red-600 px-5 py-2 rounded-xl font-bold shadow hover:bg-red-50 transition"
        >
          Logout
        </button>
      </div>
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-md w-full text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-gray-800">
          Welcome BHAI
        </h1>

        <p className="text-gray-600 text-base sm:text-lg mb-8">
          Book appointments easily and manage your bookings seamlessly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/customer/book"
            className="bg-blue-600 hover:bg-blue-700 transition text-white font-semibold px-8 py-3 rounded-xl shadow-md"
          >
            Book Appointment
          </Link>

          <Link
            to="/customer/my-bookings"
            className="bg-gray-800 hover:bg-gray-900 transition text-white font-semibold px-8 py-3 rounded-xl shadow-md"
          >
            My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
