// Importing React and necessary hooks 
import React, { useState, useEffect, useMemo } from 'react';
// Importing routing hook for navigation
import { useNavigate } from 'react-router-dom';
// Importing the ArrowLeft icon for UI consistency
import { ArrowLeft } from 'lucide-react';

// Importing the shared external stylesheet
import './ServiceDirectory.css';

// ── Helper: Parse a numeric year value from strings like "5 years", "10 Years", "3" ──
function parseExperienceYears(exp) {
    if (!exp) return 0;
    const match = String(exp).match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

// Main Component for the Housekeeping directory
export default function HouseKeepingDirectory() {
    // Setup navigation
    const navigate = useNavigate();

    // Redirects user to chat, passing provider context
    // FIX #9: Separate chat and booking actions
    const handleChatClick = (provider) => {
        navigate('/chat', { state: { providerData: provider } });
    };

    const handleBookClick = (provider) => {
        navigate('/booking', { state: { providerData: provider } });
    };

    // State initialization for array of housekeepers, loading status, and errors
    const [houseKeepers, setHouseKeepers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State to track which filter is currently active
    const [activeFilter, setActiveFilter] = useState('top_rated');

    // useEffect block to fetch data on component mount
    useEffect(() => {
        const fetchHouseKeepers = async () => {
            try {
                // Hitting the specific backend endpoint for Housekeeping
                const response = await fetch('http://localhost:8009/Service_HouseKeeping', {
                    method: 'GET',
                    credentials: 'include',
                });

                const result = await response.json();

                // Validating network success
                if (!response.ok) {
                    throw new Error(result.message || 'Failed to fetch data from the server');
                }

                // Populating the state array with data
                setHouseKeepers(result.data || []);

            } catch (err) {
                // Storing errors to render the fallback UI
                setError(err.message);
            } finally {
                // Concluding the loading phase
                setIsLoading(false);
            }
        };

        fetchHouseKeepers();
    }, []); // Run once

    // ── Sorting logic: useMemo recalculates only when data or filter changes ──
    const sortedHouseKeepers = useMemo(() => {
        const sorted = [...houseKeepers];

        switch (activeFilter) {
            case 'top_rated':
                sorted.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
                break;
            case 'city':
                sorted.sort((a, b) => (a.City || '').localeCompare(b.City || ''));
                break;
            case 'experience':
                sorted.sort((a, b) => parseExperienceYears(b.Experience) - parseExperienceYears(a.Experience));
                break;
            default:
                break;
        }

        return sorted;
    }, [houseKeepers, activeFilter]);

    // ── Guard renders ────────────────────────────────────────────────────────────

    // Loading screen
    if (isLoading) {
        return (
            <div className="directory-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <p style={{ fontSize: '18px', color: '#0c3396', fontWeight: 600 }}>⏳ Loading service providers…</p>
            </div>
        );
    }

    // Error screen
    if (error) {
        return (
            <div className="directory-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '16px' }}>
                <p style={{ fontSize: '18px', color: '#c0392b', fontWeight: 600 }}>❌ {error}</p>
                <p style={{ color: '#555' }}>Please make sure you are logged in and try again.</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{ padding: '10px 24px', background: '#0c3396', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // Main Return Statement
    return (
        <div className="directory-container">
            {/* Navigation back to User Dashboard */}
            <button
                onClick={() => navigate('/User_dashboard')}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', background: 'none',
                    border: 'none', color: '#0c3396', fontSize: '14px', fontWeight: '600',
                    cursor: 'pointer', marginBottom: '20px', padding: '0'
                }}
            >
                <ArrowLeft size={16} />
                Back to Dashboard
            </button>

            {/* Directory specifics for Housekeeping */}
            <header className="directory-header">
                <h1>Housekeeping Experts</h1>
                <p>Connect with verified professionals for deep cleaning and daily maintenance.</p>
            </header>

            {/* Filters and Counter */}
            <div className="filter-bar">
                <div className="filter-options">
                    <span className="filter-label">Filter by:</span>
                    <button
                        className={`filter-btn ${activeFilter === 'top_rated' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('top_rated')}
                    >
                        Top Rated
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'city' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('city')}
                    >
                        City: A–Z
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'experience' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('experience')}
                    >
                        Experience
                    </button>
                </div>

                <div className="results-count">
                    <span className="verified-icon">✔</span> {houseKeepers.length} Verified Cleaners found
                </div>
            </div>

            <div className="cards-grid">
                {/* Render a fallback message if the database returns an empty array */}
                {sortedHouseKeepers.length === 0 && (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#555', fontSize: '16px', padding: '40px 0' }}>
                        No housekeeping providers found at the moment. Please check back later.
                    </p>
                )}

                {/* Map the sorted provider data to visual UI cards */}
                {sortedHouseKeepers.map((provider) => (
                    <div className="profile-card" key={provider.id || provider.Email}>
                        <div className="card-body">
                            {/* Identifier and Rating */}
                            <div className="card-header">
                                <h2>{provider.UserName}</h2>
                                <span className="rating-pill">⭐ {provider.rating || 'New'}</span>
                            </div>

                            {/* Subtitle designating their exact service role */}
                            <p className="role-text">{provider.serviceType || 'Housekeeper'}</p>

                            {/* Work history and location tags */}
                            <div className="meta-details">
                                <span>💼 {provider.Experience}</span>
                                <span>📍 {provider.City}</span>
                            </div>

                            {/* Profile catchphrase */}
                            <blockquote className="review-quote">
                                "{provider.quote || 'Making your home spotless and comfortable.'}"
                            </blockquote>

                            {/* FIX #9: Two separate buttons */}
                            <div className="card-footer" style={{ gap: '8px' }}>
                                <button
                                    className="book-btn"
                                    onClick={() => handleChatClick(provider)}
                                    style={{ background: '#f0f4ff', color: '#0c3396', border: '1.5px solid #c3d2f2' }}
                                >
                                    💬 Chat
                                </button>
                                <button
                                    className="book-btn"
                                    onClick={() => handleBookClick(provider)}
                                >
                                    📅 Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}