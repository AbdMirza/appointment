import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div
      className="min-h-screen flex flex-col justify-between relative text-slate-100 overflow-hidden font-sans"
      style={{
        backgroundImage: "linear-gradient(to bottom right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.8), rgba(49, 46, 129, 0.4)), url('/frontimg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full z-20 border-b border-slate-800/40 bg-slate-950/20 backdrop-blur-md px-6 py-4 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-white"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent tracking-tight">
              Appointify
            </span>
          </div>
          <div>
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-300 hover:text-white transition duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 py-12 md:py-24 z-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left: Copy & Features */}
          <div className="lg:col-span-7 text-left space-y-6 md:space-y-8">
            <div className="inline-flex items-center space-x-2 bg-slate-800/50 border border-slate-700/30 rounded-full px-4 py-1.5 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Simplified Bookings
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              The modern way to{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                schedule
              </span>{" "}
              and{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                book
              </span>{" "}
              appointments.
            </h1>

            <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
              A powerful multi-tenant scheduling engine for businesses, staff members, and customers. Coordinate calendars, automate confirmations, and collect payments effortlessly.
            </p>

            {/* Feature List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-3 text-slate-300">
                <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full border border-emerald-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="font-medium text-sm md:text-base">
                  Real-time slots with double-booking prevention
                </span>
              </div>

              <div className="flex items-center space-x-3 text-slate-300">
                <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full border border-emerald-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="font-medium text-sm md:text-base">
                  Dedicated portals for Admins, Staff, and Clients
                </span>
              </div>

              <div className="flex items-center space-x-3 text-slate-300">
                <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full border border-emerald-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="font-medium text-sm md:text-base">
                  Integrated Stripe payments & automated notifications
                </span>
              </div>
            </div>
          </div>

          {/* Right: Glassmorphic Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] bg-slate-900/60 border border-slate-700/35 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative group hover:border-slate-600/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-indigo-500/5 rounded-3xl pointer-events-none" />
              
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Welcome to Appointify
                  </h2>
                  <p className="text-slate-400 text-sm mt-2">
                    Access your account or register as a new user
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <Link
                    to="/login"
                    className="relative group/btn overflow-hidden block w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3.5 rounded-2xl font-semibold shadow-lg shadow-blue-500/25 transition duration-200"
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      <span>Log In to Account</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4.5 w-4.5 group-hover/btn:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </Link>

                  <Link
                    to="/register"
                    className="block w-full bg-slate-800/40 hover:bg-slate-800/80 text-white border border-slate-700/50 hover:border-slate-600/80 py-3.5 rounded-2xl font-semibold backdrop-blur-sm transition duration-200"
                  >
                    Create Free Account
                  </Link>
                </div>

                <div className="border-t border-slate-800/60 pt-6">
                  <p className="text-xs text-slate-500">
                    Are you a staff member? Contact your administrator for access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full z-20 py-6 text-center border-t border-slate-800/30 bg-slate-950/10 backdrop-blur-sm">
        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Appointify. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Home;
