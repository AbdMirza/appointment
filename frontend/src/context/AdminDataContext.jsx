import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const AdminDataContext = createContext();

export const AdminDataProvider = ({ children }) => {
    const { user, token, setPendingCount } = useAuth();
    const [data, setData] = useState({
        business: null,
        services: [],
        staff: [],
        leaveRequests: [],
        customers: [],
        stats: null,
        finance: null,
        bookingsPerDay: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const fetchBootstrapData = useCallback(async (force = false) => {
        if (!token || user?.role !== 'BUSINESS_ADMIN') return;
        if (isLoaded && !force) return;

        setLoading(true);
        try {
            const res = await api.get('/analytics/bootstrap');
            const payload = res.data.data || res.data;
            setData(payload);
            setIsLoaded(true);
            setError(null);
            if (payload?.stats?.pendingCount !== undefined) {
                setPendingCount(payload.stats.pendingCount);
            }
        } catch (err) {
            console.error("Error fetching bootstrap data:", err);
            setError("Failed to load business data.");
        } finally {
            setLoading(false);
        }
    }, [token, user?.role, isLoaded, setPendingCount]);

    useEffect(() => {
        if (token && user?.role === 'BUSINESS_ADMIN' && !isLoaded) {
            fetchBootstrapData();
        }
    }, [token, user?.role, isLoaded, fetchBootstrapData]);

    useEffect(() => {
        if (!token) {
            setData({
                business: null,
                services: [],
                staff: [],
                leaveRequests: [],
                customers: [],
                stats: null,
                finance: null,
                bookingsPerDay: [],
            });
            setIsLoaded(false);
            setPendingCount(0);
        }
    }, [token, setPendingCount]);

    const value = {
        ...data,
        loading,
        error,
        isLoaded,
        refreshData: () => fetchBootstrapData(true),
        setData,
    };

    return (
        <AdminDataContext.Provider value={value}>
            {children}
        </AdminDataContext.Provider>
    );
};

export const useAdminData = () => {
    const context = useContext(AdminDataContext);
    if (!context) {
        throw new Error('useAdminData must be used within an AdminDataProvider');
    }
    return context;
};
