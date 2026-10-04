// MyRequests.jsx — Shows the logged-in user's complete booking history
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, Wrench, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';
import './MyRequests.css';

// Helper: colour-coded status badge
function StatusBadge({ status }) {
    const map = {
        Pending:   { icon: <AlertCircle size={13} />, cls: 'badge-pending'   },
        Accepted:  { icon: <CheckCircle2 size={13} />, cls: 'badge-accepted'  },
        Completed: { icon: <CheckCircle2 size={13} />, cls: 'badge-completed' },
        Declined:  { icon: <XCircle size={13} />,      cls: 'badge-declined'  },
    };
    const { icon, cls } = map[status] || map.Pending;
    return (
        <span className={`status-badge ${cls}`}>
            {icon} {status}
        </span>
    );
}

export default function MyRequests() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await fetch('http://localhost:8009/my_bookings', {
                    credentials: 'include'
                });
                if (!res.ok) {
                    if (res.status === 401) {
                        navigate('/login');
                        return;
                    }
                    throw new Error('Failed to fetch bookings.');
                }
                const data = await res.json();
                setBookings(data.bookings || []);
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const TABS = ['All', 'Pending', 'Accepted', 'Completed', 'Declined'];

    const filtered = activeTab === 'All'
        ? bookings
        : bookings.filter(b => b.status === activeTab);

    // Format date string nicely
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="myrequests-page">
            {/* Header */}
            <div className="myrequests-header">
                <button className="myrequests-back-btn" onClick={() => navigate('/User_dashboard')}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <div>
                    <h1 className="myrequests-title">My Service Requests</h1>
                    <p className="myrequests-subtitle">Track the status of all your bookings in one place.</p>
                </div>
            </div>

            {/* Tab Filter */}
            <div className="myrequests-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        className={`myrequests-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                        {tab !== 'All' && (
                            <span className="myrequests-tab-count">
                                {bookings.filter(b => b.status === tab).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="myrequests-loading">
                    <div className="myrequests-spinner" />
                    <p>Loading your bookings…</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="myrequests-empty">
                    <span className="myrequests-empty-icon">📋</span>
                    <h3>No {activeTab === 'All' ? '' : activeTab} bookings found</h3>
                    <p>
                        {activeTab === 'All'
                            ? "You haven't made any bookings yet. Find a service provider to get started!"
                            : `You have no ${activeTab.toLowerCase()} bookings at the moment.`}
                    </p>
                    {activeTab === 'All' && (
                        <button
                            className="myrequests-cta-btn"
                            onClick={() => navigate('/User_dashboard')}
                        >
                            Browse Services
                        </button>
                    )}
                </div>
            ) : (
                <div className="myrequests-list">
                    {filtered.map(booking => (
                        <div key={booking.id} className="myrequests-card">
                            <div className="myrequests-card-top">
                                <div className="myrequests-card-service">
                                    <Wrench size={16} className="myrequests-service-icon" />
                                    <span className="myrequests-service-type">{booking.serviceType}</span>
                                    <StatusBadge status={booking.status} />
                                </div>
                                <span className="myrequests-card-id">
                                    #PRFX-{String(booking.id).padStart(4, '0')}
                                </span>
                            </div>

                            <div className="myrequests-card-body">
                                <div className="myrequests-info-row">
                                    <span className="myrequests-label">Provider</span>
                                    <span className="myrequests-value">{booking.providerName || booking.providerEmail}</span>
                                </div>
                                <div className="myrequests-info-row">
                                    <span className="myrequests-label">
                                        <CalendarDays size={13} /> Date
                                    </span>
                                    <span className="myrequests-value">{formatDate(booking.bookingDate)}</span>
                                </div>
                                <div className="myrequests-info-row">
                                    <span className="myrequests-label">
                                        <Clock size={13} /> Time Slot
                                    </span>
                                    <span className="myrequests-value">{booking.timeSlot}</span>
                                </div>
                                {booking.description && (
                                    <div className="myrequests-description">
                                        <span className="myrequests-label">Description</span>
                                        <p className="myrequests-desc-text">{booking.description}</p>
                                    </div>
                                )}
                            </div>

                            <div className="myrequests-card-footer">
                                <span className="myrequests-created">
                                    Booked on {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
