// ProtectedRoute.jsx — Wraps any route that requires authentication.
// If the user is not logged in, redirects to /login automatically.
// Optionally, requiredRole can restrict access to 'User' or 'Service Provider'.

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requiredRole = null }) {
    const [status, setStatus] = useState('loading'); // 'loading' | 'authorized' | 'unauthorized'

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch('http://localhost:8009/session-check', {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    // If a specific role is required, check it
                    if (requiredRole && data.role !== requiredRole) {
                        setStatus('unauthorized');
                    } else {
                        setStatus('authorized');
                    }
                } else {
                    setStatus('unauthorized');
                }
            } catch {
                setStatus('unauthorized');
            }
        };
        checkSession();
    }, [requiredRole]);

    if (status === 'loading') {
        return (
            <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                minHeight: '100vh', background: '#0f172a', color: '#94a3b8',
                fontSize: '16px', fontFamily: 'Inter, sans-serif'
            }}>
                Checking authentication…
            </div>
        );
    }

    if (status === 'unauthorized') {
        return <Navigate to="/login" replace />;
    }

    return children;
}
