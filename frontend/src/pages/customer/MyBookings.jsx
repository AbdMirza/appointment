const MyBookings = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-indigo-100 flex flex-col items-center p-6">

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-gray-800 text-center">
        My Bookings
      </h1>

      <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-10 w-full max-w-3xl overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-3 px-4 text-gray-700 uppercase tracking-wide">Service</th>
              <th className="py-3 px-4 text-gray-700 uppercase tracking-wide">Date</th>
              <th className="py-3 px-4 text-gray-700 uppercase tracking-wide">Time</th>
              <th className="py-3 px-4 text-gray-700 uppercase tracking-wide">Status</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
              <td className="py-3 px-4 font-medium text-gray-800">Consultation</td>
              <td className="py-3 px-4 text-gray-600">22 Jan 2026</td>
              <td className="py-3 px-4 text-gray-600">10:00 AM</td>
              <td className="py-3 px-4 text-green-600 font-semibold">Confirmed</td>
            </tr>

            <tr className="hover:bg-gray-50 transition">
              <td className="py-3 px-4 font-medium text-gray-800">Checkup</td>
              <td className="py-3 px-4 text-gray-600">25 Jan 2026</td>
              <td className="py-3 px-4 text-gray-600">01:00 PM</td>
              <td className="py-3 px-4 text-blue-600 font-semibold">Pending</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default MyBookings;
