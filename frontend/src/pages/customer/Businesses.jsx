import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api";

const Businesses = () => {
    const { logout, token } = useAuth();
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const res = await fetch(`${API_URL}/business/public`);
                if (res.ok) {
                    const data = await res.json();
                    setBusinesses(data);
                }
            } catch (error) {
                console.error("Error fetching businesses:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBusinesses();
    }, []);

    const handleSelectBusiness = (business) => {
        localStorage.setItem("selectedBusinessId", business.id);
        localStorage.setItem("selectedBusinessName", business.name);
        navigate("/customer/book");
    };

    const filteredBusinesses = businesses.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center">
            {/* Navbar */}
            <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                <Link to="/customer/home" className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                        Appointify
                    </span>
                </Link>
                <button
                    onClick={logout}
                    className="bg-white text-slate-600 px-5 py-2 rounded-xl font-semibold border border-slate-200 hover:bg-slate-50 hover:text-red-500 hover:border-red-100 transition-all duration-300 shadow-sm"
                >
                    Logout
                </button>
            </nav>

            <main className="w-full max-w-6xl px-6 py-12">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 mb-2">Discover Businesses</h1>
                        <p className="text-slate-500">Find and book appointments with local experts</p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Search by name or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredBusinesses.map(business => (
                            <div key={business.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col overflow-hidden">
                                <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-8 relative">
                                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">
                                        {business.timezone}
                                    </div>
                                    <h2 className="text-3xl font-black text-white text-center leading-tight">
                                        {business.name.split(' ').map(w => w[0]).join('').toUpperCase()}
                                    </h2>
                                </div>

                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                                        {business.name}
                                    </h3>

                                    <div className="space-y-3 mb-8">
                                        <div className="flex items-start gap-2 text-slate-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-sm">{business.address}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span className="text-sm">{business.contact}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSelectBusiness(business)}
                                        className="mt-auto w-full bg-slate-50 text-slate-800 font-bold py-4 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300"
                                    >
                                        View Services
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {businesses.length === 0 && !loading && (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                        <p className="text-slate-400 text-lg">No businesses found matching your search.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Businesses;
