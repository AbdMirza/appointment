import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get("session_id");
    const bookingId = searchParams.get("booking_id");
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!sessionId || !bookingId) {
            navigate("/customer/my-bookings");
            return;
        }

        let isMounted = true;

        const confirmPayment = async () => {
            try {
                await api.post("/payments/confirm", { sessionId, bookingId });
                if (isMounted) {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Payment confirmation error:", err);
                if (isMounted) {
                    setError("Could not verify this payment automatically. Please check your bookings page.");
                    setLoading(false);
                }
            }
        };

        confirmPayment();

        return () => {
            isMounted = false;
        };
    }, [sessionId, bookingId, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-500/10 border border-slate-50 overflow-hidden text-center p-12">
                {loading ? (
                    <div className="space-y-6">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                        <h2 className="text-2xl font-bold text-slate-800">Verifying Payment...</h2>
                        <p className="text-slate-500">Please wait while we confirm your transaction.</p>
                    </div>
                ) : error ? (
                    <div className="space-y-8 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">Notice</h2>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                {error}
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Booking Reference</span>
                            <span className="font-mono font-bold text-slate-600">{bookingId}</span>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link 
                                to="/customer/my-bookings" 
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                            >
                                View My Bookings
                            </Link>
                            <Link 
                                to="/customer/businesses" 
                                className="text-slate-500 font-bold hover:text-blue-600 transition-colors"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">Payment Successful!</h2>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Your booking has been confirmed. A receipt has been generated and sent to your email.
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Booking Reference</span>
                            <span className="font-mono font-bold text-blue-600">{bookingId}</span>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link 
                                to="/customer/my-bookings" 
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                            >
                                View My Bookings
                            </Link>
                            <Link 
                                to="/customer/businesses" 
                                className="text-slate-500 font-bold hover:text-blue-600 transition-colors"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
