import Sidebar from "../../components/layout/Sidebar";
import StaffTimeOffManager from "../../components/staff/StaffTimeOffManager";
import { useAuth } from "../../context/AuthContext";

const StaffTimeOff = () => {
    const { user, token } = useAuth();

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Time Off Management</h1>
                    <p className="text-slate-500 mt-1">Request vacations or sick leaves and track their status.</p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <StaffTimeOffManager staff={user} token={token} />
                </div>
            </div>
        </div>
    );
};

export default StaffTimeOff;
