import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
      <div className="bg-white p-10 rounded-2xl shadow-2xl text-center w-[400px]">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          Appointment Booking System
        </h1>

        <p className="text-slate-500 mb-8">
          Login or create a new customer account
        </p>

        <div className="space-y-4">
          <Link
            to="/login"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="block w-full border border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-lg font-semibold transition"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
