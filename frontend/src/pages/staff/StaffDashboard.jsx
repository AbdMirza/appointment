const StaffDashboard = () => {
  return (
    <div className="min-h-screen bg-blue-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Staff Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6 ">
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Today Appointments</h2>
          <p className="text-2xl font-bold mt-2">8</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Upcoming</h2>
          <p className="text-2xl font-bold mt-2">14</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="text-lg font-semibold">Completed</h2>
          <p className="text-2xl font-bold mt-2">32</p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-4">
          Assigned Appointments
        </h2>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Customer</th>
              <th>Service</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">Ali Khan</td>
              <td>Consultation</td>
              <td>10:00 AM</td>
              <td className="text-blue-600">Pending</td>
            </tr>
            <tr>
              <td className="py-2">Sara Ahmed</td>
              <td>Checkup</td>
              <td>12:30 PM</td>
              <td className="text-green-600">Confirmed</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffDashboard;
