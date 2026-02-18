import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Home = () => {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center">
      {/* Premium Navbar */}
      <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
            Appointify
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/customer/profile"
            className="flex items-center gap-2 text-slate-600 px-4 py-2 rounded-xl font-semibold hover:bg-slate-50 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </Link>
          <button
            onClick={logout}
            className="bg-white text-slate-600 px-5 py-2 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50 hover:text-red-500 hover:border-red-100 transition-all duration-300 shadow-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="w-full max-w-6xl px-6 py-16 flex flex-col items-center">
        <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl shadow-blue-500/5 overflow-hidden border border-slate-50">
          {/* Decorative Blobs */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl"></div>

          <div className="relative p-10 sm:p-20 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-6 border border-blue-100 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Simplified Bookings
            </div>

            <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 tracking-tight text-slate-900">
              Welcome  <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                {user?.name || "Friend"}
              </span>
            </h1>

            <p className="text-slate-500 text-lg sm:text-xl max-w-2xl mb-12 leading-relaxed">
              Experience the future of appointment management. Book with your favorite businesses in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
              <Link
                to="/customer/businesses"
                className="group relative bg-slate-900 text-white font-bold px-10 py-5 rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Find Businesses
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                to="/customer/my-bookings"
                className="bg-white text-slate-700 font-bold px-10 py-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-all duration-300 shadow-sm flex items-center justify-center"
              >
                My Bookings
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl mt-16 px-6">
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
            <div className="text-3xl font-bold text-slate-800 mb-1">24/7</div>
            <div className="text-slate-400 text-sm font-medium">Availability</div>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
            <div className="text-3xl font-bold text-slate-800 mb-1">100+</div>
            <div className="text-slate-400 text-sm font-medium">Businesses</div>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
            <div className="text-3xl font-bold text-slate-800 mb-1">Secured</div>
            <div className="text-slate-400 text-sm font-medium">Transactions</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
