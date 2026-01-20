import Sidebar from "../../components/layout/Sidebar";

const Services = () => {
  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">
          Services
        </h1>

        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <div className="flex justify-between">
            <span>Consultation</span>
            <span>$50</span>
          </div>

          <div className="flex justify-between">
            <span>Checkup</span>
            <span>$30</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
