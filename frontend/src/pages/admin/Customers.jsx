import { useAdminData } from "../../context/AdminDataContext";

const Customers = () => {
    const { customers = [], loading } = useAdminData();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Customers</h1>
                <p className="text-slate-500 mt-1">Customers who have booked with your business.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4">Recent Services</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center text-slate-500">
                                        Loading customers...
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center text-slate-500">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-bold text-slate-800">{customer.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{customer.email}</td>
                                        <td className="px-6 py-4 text-slate-600">{formatDate(customer.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {customer.bookings?.length > 0 ? (
                                                    customer.bookings.slice(0, 3).map((booking) => (
                                                        <span
                                                            key={booking.id}
                                                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold"
                                                        >
                                                            {booking.service?.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">No recent bookings</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Customers;
