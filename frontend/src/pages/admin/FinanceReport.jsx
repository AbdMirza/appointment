import React from "react";
import { useAdminData } from "../../context/AdminDataContext";

const FinanceReport = () => {
  const { finance, loading } = useAdminData();

  const handleExportCSV = () => {
    if (!finance?.recentPayments || finance.recentPayments.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ["Date", "Customer", "Service", "Original Amount", "Refund", "Net Amount", "Status"];
    const rows = finance.recentPayments.map(p => {
      const isUnpaid = p.status === 'CANCELLED' || p.status === 'PENDING';
      const originalAmount = Number(p.amount);
      const refundAmount = isUnpaid ? 0 : Number(p.refundAmount || 0);
      const netAmount = isUnpaid ? 0 : (originalAmount - refundAmount);
      
      return [
        new Date(p.createdAt).toLocaleDateString(),
        p.booking?.user?.name || "N/A",
        p.booking?.service?.name || "N/A",
        originalAmount.toFixed(2),
        refundAmount.toFixed(2),
        netAmount.toFixed(2),
        p.status
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `finance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !finance) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Finance Report</h1>
          <p className="text-slate-500 font-medium">Monitor your business revenue and refunds.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
        >
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-500/20">
          <span className="font-bold text-white/80 uppercase tracking-widest text-xs block mb-2">Total Revenue</span>
          <h2 className="text-4xl font-black">${finance?.totalRevenue ? Number(finance.totalRevenue).toFixed(2) : "0.00"}</h2>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
          <span className="font-bold text-slate-400 uppercase tracking-widest text-xs block mb-2">Total Refunds</span>
          <h2 className="text-4xl font-black text-slate-800">${finance?.totalRefunds ? Number(finance.totalRefunds).toFixed(2) : "0.00"}</h2>
        </div>

        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-900/10">
          <span className="font-bold text-white/40 uppercase tracking-widest text-xs block mb-2">Net Income</span>
          <h2 className="text-4xl font-black text-green-400">${finance?.netIncome ? Number(finance.netIncome).toFixed(2) : "0.00"}</h2>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h3 className="text-xl font-bold text-slate-800">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Customer</th>
                <th className="px-8 py-5">Service</th>
                <th className="px-8 py-5">Original</th>
                <th className="px-8 py-5">Refund</th>
                <th className="px-8 py-5">Net</th>
                <th className="px-8 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {finance?.recentPayments?.length > 0 ? (
                finance.recentPayments.map((p) => {
                  const isUnpaid = p.status === 'CANCELLED' || p.status === 'PENDING';
                  const origAmt = Number(p.amount);
                  const refAmt = isUnpaid ? 0 : Number(p.refundAmount || 0);
                  const netAmt = isUnpaid ? 0 : (origAmt - refAmt);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 text-sm text-slate-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-8 py-5 font-bold text-slate-700">{p.booking?.user?.name || "Guest"}</td>
                      <td className="px-8 py-5 text-sm text-slate-500">{p.booking?.service?.name}</td>
                      <td className="px-8 py-5 font-bold text-slate-400 line-through">${origAmt.toFixed(2)}</td>
                      <td className="px-8 py-5 font-bold text-red-400">-${refAmt.toFixed(2)}</td>
                      <td className="px-8 py-5 font-bold text-slate-800">${netAmt.toFixed(2)}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ${
                          p.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : 
                          p.status === 'PARTIALLY_REFUNDED' ? 'bg-amber-50 text-amber-600 ring-amber-100' :
                          'bg-red-50 text-red-600 ring-red-100'
                        }`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="7" className="px-8 py-20 text-center text-slate-400">No transactions found yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceReport;
