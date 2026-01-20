import Sidebar from "../../components/layout/Sidebar";

const Dashboard = () => {
  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-slate-500">Total Bookings</p>
            <h2 className="text-3xl font-bold mt-2">124</h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-slate-500">Today</p>
            <h2 className="text-3xl font-bold mt-2">12</h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-slate-500">Staff</p>
            <h2 className="text-3xl font-bold mt-2">8</h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-slate-500">Revenue</p>
            <h2 className="text-3xl font-bold mt-2">$1,240</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
