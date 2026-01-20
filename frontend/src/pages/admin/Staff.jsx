import Sidebar from "../../components/layout/Sidebar";

const Staff = () => {
  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">
          Staff Members
        </h1>

        <div className="bg-white p-6 rounded-xl shadow">
          <ul className="space-y-3">
            <li className="flex justify-between">
              <span>Dr. Ahmed</span>
              <span className="text-green-600">Active</span>
            </li>

            <li className="flex justify-between">
              <span>Dr. Sara</span>
              <span className="text-green-600">Active</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Staff;
