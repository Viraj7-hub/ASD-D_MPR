// Provider_dashboard.jsx
// FIX #4: Fetch real provider name + bookings from DB (replaces all hardcoded mock data)
// FIX #5: All sidebar nav items now render actual content panels
// FIX #12: Notification bell dropdown shows real incoming booking count
// FIX #16: Toast instead of alert()

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ClipboardList, Inbox, TrendingUp,
    Settings, HelpCircle, LogOut, MapPin, Clock, Star,
    IndianRupee, Users, CheckCircle2, ChevronRight, Bell,
    MessageSquare, Calendar, BadgeCheck, XCircle, AlertCircle,
    User, Phone, Mail, Briefcase
} from 'lucide-react';
import { useToast } from './Toast.jsx';
import './Provider_dashboard.css';

// ── Avatar initials helper ──
function Initials({ name, size = 36 }) {
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const colors = ['#2B3A8C', '#059669', '#d97706', '#7c3aed', '#dc2626'];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
        <div
            className="avatar-initials"
            style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
        >
            {initials}
        </div>
    );
}

// ── Status badge ──
function StatusBadge({ status }) {
    const map = {
        Pending:   { cls: 'badge-pending',   icon: <AlertCircle size={12} /> },
        Accepted:  { cls: 'badge-accepted',  icon: <CheckCircle2 size={12} /> },
        Completed: { cls: 'badge-completed', icon: <CheckCircle2 size={12} /> },
        Declined:  { cls: 'badge-declined',  icon: <XCircle size={12} /> },
    };
    const { cls, icon } = map[status] || map.Pending;
    return <span className={`pd-status-badge ${cls}`}>{icon} {status}</span>;
}

export default function ProviderDashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [activeNav, setActiveNav] = useState('dashboard');

    // FIX #4: Real data from DB
    const [providerProfile, setProviderProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // FIX #12: Bell notification state
    const [showNotifications, setShowNotifications] = useState(false);
    const bellRef = useRef(null);

    // Fetch real provider profile + incoming bookings
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, bookingsRes] = await Promise.all([
                    fetch('http://localhost:8009/provider_profile', { credentials: 'include' }),
                    fetch('http://localhost:8009/provider_bookings', { credentials: 'include' }),
                ]);

                if (profileRes.status === 401 || bookingsRes.status === 401) {
                    navigate('/login');
                    return;
                }

                if (profileRes.ok) {
                    const profile = await profileRes.json();
                    setProviderProfile(profile);
                }

                if (bookingsRes.ok) {
                    const data = await bookingsRes.json();
                    setBookings(data.bookings || []);
                }
            } catch (err) {
                showToast('Failed to load dashboard data.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Close bell dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Accept / Decline a booking
    const handleBookingStatus = async (bookingId, status) => {
        try {
            const res = await fetch('http://localhost:8009/booking_status', {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, status })
            });
            if (res.ok) {
                setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
                showToast(`Booking ${status.toLowerCase()} successfully.`, 'success');
            } else {
                showToast('Failed to update booking status.', 'error');
            }
        } catch {
            showToast('Network error. Please try again.', 'error');
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('http://localhost:8009/logout', {
                method: 'POST',
                credentials: 'include',
            });
            if (response.ok) navigate('/login');
        } catch (err) {
            showToast('Logout error. Please try again.', 'error');
        }
    };

    // FIX #4: Derived stats from real booking data
    const pendingCount = bookings.filter(b => b.status === 'Pending').length;
    const acceptedCount = bookings.filter(b => b.status === 'Accepted').length;
    const completedCount = bookings.filter(b => b.status === 'Completed').length;

    const NAV_ITEMS = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { id: 'requests', label: 'My Requests', icon: <ClipboardList size={18} /> },
        { id: 'earnings', label: 'Earnings', icon: <TrendingUp size={18} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    ];

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#0c3396', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p>Loading your dashboard…</p>
                </div>
            </div>
        );
    }

    // ── FIX #5: Render different content panels based on activeNav ──
    const renderMainContent = () => {
        switch (activeNav) {

            // ════════════════ DASHBOARD ════════════════
            case 'dashboard':
                return (
                    <>
                        {/* Top Header */}
                        <div className="pd-topbar">
                            <div className="pd-topbar-left">
                                <h1 className="pd-greeting">
                                    Namaste, {providerProfile?.UserName?.split(' ')[0] || 'Provider'}
                                </h1>
                                <p className="pd-greeting-sub">
                                    You have <strong>{acceptedCount} confirmed jobs</strong> and <strong>{pendingCount} new requests</strong> waiting for your response today.
                                </p>
                            </div>
                            <div className="pd-topbar-right">
                                {providerProfile?.City && (
                                    <span className="pd-location-badge">
                                        <span className="pd-location-label">CITY</span>
                                        <span className="pd-location-value">
                                            <MapPin size={12} />
                                            {providerProfile.City}
                                        </span>
                                    </span>
                                )}
                                {/* FIX #12: Bell with real pending count */}
                                <div ref={bellRef} style={{ position: 'relative' }}>
                                    <button className="pd-icon-btn" onClick={() => setShowNotifications(p => !p)} style={{ position: 'relative' }}>
                                        <Bell size={18} />
                                        {pendingCount > 0 && (
                                            <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', border: '2px solid white' }} />
                                        )}
                                    </button>
                                    {showNotifications && (
                                        <div style={{ position: 'absolute', top: '44px', right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: '280px', zIndex: 1000, overflow: 'hidden' }}>
                                            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>Incoming Requests</div>
                                            {pendingCount === 0 ? (
                                                <div style={{ padding: '16px', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>No pending requests</div>
                                            ) : (
                                                bookings.filter(b => b.status === 'Pending').slice(0, 5).map(b => (
                                                    <div key={b.id} style={{ padding: '10px 16px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #f8fafc' }}>
                                                        <AlertCircle size={12} color="#d97706" style={{ marginRight: '6px' }} />
                                                        New {b.serviceType} request from {b.clientName || 'a user'}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Row — FIX #4: Real computed stats */}
                        <div className="pd-stats-row">
                            <div className="pd-stat-card stat-blue">
                                <div className="pd-stat-icon"><ClipboardList size={20} /></div>
                                <div className="pd-stat-body">
                                    <div className="pd-stat-value">{pendingCount}</div>
                                    <div className="pd-stat-label">Pending Requests</div>
                                </div>
                            </div>
                            <div className="pd-stat-card stat-green">
                                <div className="pd-stat-icon"><CheckCircle2 size={20} /></div>
                                <div className="pd-stat-body">
                                    <div className="pd-stat-value">{acceptedCount}</div>
                                    <div className="pd-stat-label">Accepted Jobs</div>
                                </div>
                            </div>
                            <div className="pd-stat-card stat-yellow">
                                <div className="pd-stat-icon"><Star size={20} /></div>
                                <div className="pd-stat-body">
                                    <div className="pd-stat-value">{completedCount}</div>
                                    <div className="pd-stat-label">Jobs Completed</div>
                                </div>
                            </div>
                            <div className="pd-stat-card stat-purple">
                                <div className="pd-stat-icon"><Users size={20} /></div>
                                <div className="pd-stat-body">
                                    <div className="pd-stat-value">{bookings.length}</div>
                                    <div className="pd-stat-label">Total Bookings</div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Requests Preview */}
                        <div className="pd-content-cols">
                            <div className="pd-col-main">
                                <div className="pd-section-header">
                                    <h2 className="pd-section-title">New Service Requests</h2>
                                    <button className="pd-view-all-btn" onClick={() => setActiveNav('requests')}>
                                        View All <ChevronRight size={14} />
                                    </button>
                                </div>
                                <div className="pd-requests-list">
                                    {bookings.filter(b => b.status === 'Pending').length === 0 && (
                                        <p className="pd-empty-state">No pending requests right now.</p>
                                    )}
                                    {bookings.filter(b => b.status === 'Pending').slice(0, 3).map(req => (
                                        <div key={req.id} className="pd-request-card">
                                            <div className="pd-req-details">
                                                <span className="pd-service-tag">{req.serviceType}</span>
                                                <div className="pd-req-top-row">
                                                    <h3 className="pd-req-title">{req.description?.slice(0, 60) || 'Service Request'}…</h3>
                                                </div>
                                                <div className="pd-req-meta">
                                                    <span><Users size={12} /> {req.clientName || req.userEmail}</span>
                                                    <span><Clock size={12} /> {req.timeSlot} · {new Date(req.bookingDate).toLocaleDateString('en-IN')}</span>
                                                </div>
                                                <div className="pd-req-actions">
                                                    <button className="pd-btn-accept" onClick={() => handleBookingStatus(req.id, 'Accepted')}>
                                                        Accept Request
                                                    </button>
                                                    <button className="pd-btn-decline" onClick={() => handleBookingStatus(req.id, 'Declined')}>
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Profile summary sidebar */}
                            <div className="pd-col-side">
                                <div className="pd-side-card">
                                    <h2 className="pd-section-title">Your Profile</h2>
                                    {providerProfile && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                                            <Initials name={providerProfile.UserName || 'P'} size={48} />
                                            <strong style={{ color: '#0f172a', fontSize: '15px' }}>{providerProfile.UserName}</strong>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <span style={{ fontSize: '13px', color: '#64748b' }}>📧 {providerProfile.Email}</span>
                                                <span style={{ fontSize: '13px', color: '#64748b' }}>📞 {providerProfile.phoneNumber}</span>
                                                <span style={{ fontSize: '13px', color: '#64748b' }}>🔧 {providerProfile.serviceType}</span>
                                                <span style={{ fontSize: '13px', color: '#64748b' }}>💼 {providerProfile.Experience} experience</span>
                                                <span style={{ fontSize: '13px', color: '#64748b' }}>📍 {providerProfile.City}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                );

            // ════════════════ MY REQUESTS (full list) ════════════════
            case 'requests':
                return (
                    <div>
                        <div className="pd-topbar" style={{ marginBottom: '24px' }}>
                            <h1 className="pd-greeting">All Booking Requests</h1>
                        </div>
                        {bookings.length === 0 ? (
                            <p className="pd-empty-state">No bookings found yet.</p>
                        ) : (
                            <div className="pd-requests-list">
                                {bookings.map(req => (
                                    <div key={req.id} className={`pd-request-card ${req.status !== 'Pending' ? 'accepted' : ''}`}>
                                        <div className="pd-req-details">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                <span className="pd-service-tag">{req.serviceType}</span>
                                                <StatusBadge status={req.status} />
                                                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                                    #PRFX-{String(req.id).padStart(4, '0')}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 8px' }}>
                                                {req.description}
                                            </p>
                                            <div className="pd-req-meta">
                                                <span><Users size={12} /> {req.clientName || req.userEmail}</span>
                                                {req.clientPhone && <span><Phone size={12} /> {req.clientPhone}</span>}
                                                <span><Calendar size={12} /> {new Date(req.bookingDate).toLocaleDateString('en-IN')}</span>
                                                <span><Clock size={12} /> {req.timeSlot}</span>
                                            </div>
                                            {req.status === 'Pending' && (
                                                <div className="pd-req-actions" style={{ marginTop: '10px' }}>
                                                    <button className="pd-btn-accept" onClick={() => handleBookingStatus(req.id, 'Accepted')}>Accept</button>
                                                    <button className="pd-btn-decline" onClick={() => handleBookingStatus(req.id, 'Declined')}>Decline</button>
                                                </div>
                                            )}
                                            {req.status === 'Accepted' && (
                                                <div className="pd-req-actions" style={{ marginTop: '10px' }}>
                                                    <button className="pd-btn-accept" onClick={() => handleBookingStatus(req.id, 'Completed')}>
                                                        <CheckCircle2 size={14} /> Mark Completed
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            // ════════════════ EARNINGS ════════════════
            case 'earnings':
                const completed = bookings.filter(b => b.status === 'Completed');
                return (
                    <div>
                        <div className="pd-topbar" style={{ marginBottom: '24px' }}>
                            <h1 className="pd-greeting">Earnings Overview</h1>
                        </div>
                        <div className="pd-stats-row">
                            <div className="pd-stat-card stat-green">
                                <div className="pd-stat-icon"><CheckCircle2 size={20} /></div>
                                <div className="pd-stat-body">
                                    <div className="pd-stat-value">{completed.length}</div>
                                    <div className="pd-stat-label">Jobs Completed</div>
                                </div>
                            </div>
                            <div className="pd-stat-card stat-blue">
                                <div className="pd-stat-icon"><IndianRupee size={20} /></div>
                                <div className="pd-stat-body">
                                    <div className="pd-stat-value">{acceptedCount}</div>
                                    <div className="pd-stat-label">Jobs In Progress</div>
                                </div>
                            </div>
                        </div>
                        <div className="pd-side-card" style={{ marginTop: '24px' }}>
                            <p style={{ color: '#64748b', fontSize: '14px' }}>
                                💡 Earnings tracking with per-job pricing will be available once the price negotiation feature is fully integrated. Mark jobs as <strong>Completed</strong> to track your finished work.
                            </p>
                        </div>
                        <div className="pd-requests-list" style={{ marginTop: '16px' }}>
                            <h2 className="pd-section-title" style={{ marginBottom: '12px' }}>Completed Jobs</h2>
                            {completed.length === 0 ? (
                                <p className="pd-empty-state">No completed jobs yet.</p>
                            ) : (
                                completed.map(req => (
                                    <div key={req.id} className="pd-request-card accepted">
                                        <div className="pd-req-details">
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span className="pd-service-tag">{req.serviceType}</span>
                                                <StatusBadge status={req.status} />
                                            </div>
                                            <div className="pd-req-meta" style={{ marginTop: '6px' }}>
                                                <span><Users size={12} /> {req.clientName}</span>
                                                <span><Calendar size={12} /> {new Date(req.bookingDate).toLocaleDateString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            // ════════════════ SETTINGS ════════════════
            case 'settings':
                return (
                    <div>
                        <div className="pd-topbar" style={{ marginBottom: '24px' }}>
                            <h1 className="pd-greeting">Account Settings</h1>
                        </div>
                        {providerProfile && (
                            <div className="pd-side-card" style={{ maxWidth: '520px' }}>
                                <h2 className="pd-section-title" style={{ marginBottom: '16px' }}>Profile Information</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {[
                                        { icon: <User size={16} />, label: 'Full Name', value: providerProfile.UserName },
                                        { icon: <Mail size={16} />, label: 'Email', value: providerProfile.Email },
                                        { icon: <Phone size={16} />, label: 'Phone', value: providerProfile.phoneNumber },
                                        { icon: <Briefcase size={16} />, label: 'Service Type', value: providerProfile.serviceType },
                                        { icon: <Star size={16} />, label: 'Experience', value: providerProfile.Experience },
                                        { icon: <MapPin size={16} />, label: 'City', value: providerProfile.City },
                                    ].map(({ icon, label, value }) => (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ color: '#0c3396' }}>{icon}</span>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{label}</div>
                                                <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{value || '—'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '16px' }}>
                                    Contact support to update your profile information.
                                </p>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="pd-layout">
            {/* ══════════════ SIDEBAR ══════════════ */}
            <aside className="pd-sidebar">
                <div className="pd-brand">
                    <span className="pd-brand-logo">ProFix Pro</span>
                    <span className="pd-verified-badge">
                        <BadgeCheck size={13} />
                        Verified Technician
                    </span>
                </div>

                <nav className="pd-nav">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            className={`pd-nav-item ${activeNav === item.id ? 'active' : ''}`}
                            onClick={() => setActiveNav(item.id)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                            {item.id === 'requests' && pendingCount > 0 && (
                                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '999px' }}>
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                    <button className="pd-nav-item" onClick={() => navigate('/chat')}>
                        <MessageSquare size={18} />
                        <span>Chats</span>
                    </button>
                </nav>

                <div className="pd-sidebar-footer">
                    <button className="pd-nav-item muted-nav">
                        <HelpCircle size={18} />
                        <span>Help Center</span>
                    </button>
                    <button className="pd-nav-item danger-nav" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ══════════════ MAIN CONTENT ══════════════ */}
            <main className="pd-main">
                {renderMainContent()}
            </main>
        </div>
    );
}
