import Sidebar from "../../components/layout/Sidebar";

const Appointments = () => {
  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">
          Appointments
        </h1>

        <div className="bg-white p-6 rounded-xl shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Customer</th>
                <th>Service</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b">
                <td className="py-2">Ali Khan</td>
                <td>Consultation</td>
                <td>22 Jan</td>
                <td className="text-blue-600">Pending</td>
              </tr>

              <tr>
                <td className="py-2">Sara Ahmed</td>
                <td>Checkup</td>
                <td>23 Jan</td>
                <td className="text-green-600">Confirmed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
