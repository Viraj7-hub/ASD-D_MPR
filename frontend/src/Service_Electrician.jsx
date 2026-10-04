// Standard React hooks for creating stateful logic
import React, { useState, useEffect, useMemo } from 'react';
// Router hooks for moving between application views
import { useNavigate } from 'react-router-dom';
// Importing the UI back-arrow
import { ArrowLeft } from 'lucide-react';

// Link to the centralized CSS rule set
import './ServiceDirectory.css';

// ── Helper: Parse a numeric year value from strings like "5 years", "10 Years", "3" ──
function parseExperienceYears(exp) {
    if (!exp) return 0;
    const match = String(exp).match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

// Component responsible for rendering the Electricians page
export default function ElectricianDirectory() {
    // Initializing routing instance
    const navigate = useNavigate();
    // FIX #9: Separate chat and booking actions
    const handleChatClick = (provider) => {
        navigate('/chat', { state: { providerData: provider } });
    };

    const handleBookClick = (provider) => {
        navigate('/booking', { state: { providerData: provider } });
    };

    // Declaring state variables for our list of electricians, loading flags, and error catches
    const [electricians, setElectricians] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State to track which filter is currently active
    const [activeFilter, setActiveFilter] = useState('top_rated');

    // Hooking into component mount to grab backend data
    useEffect(() => {
        const fetchElectricians = async () => {
            try {
                // Target the electrical service endpoint on the local Express server
                const response = await fetch('http://localhost:8009/Service_Electrician', {
                    method: 'GET',
                    credentials: 'include',
                });

                // Convert the string response to a JSON object
                const result = await response.json();

                // Check if the backend denied the request (e.g. invalid session)
                if (!response.ok) {
                    throw new Error(result.message || 'Failed to fetch data from the server');
                }

                // Save the valid data payload to state
                setElectricians(result.data || []);

            } catch (err) {
                // Log errors so the user can be notified
                setError(err.message);
            } finally {
                // Complete the loading cycle regardless of success/fail
                setIsLoading(false);
            }
        };

        fetchElectricians();
    }, []); // Run precisely once

    // ── Sorting logic: useMemo recalculates only when data or filter changes ──
    const sortedElectricians = useMemo(() => {
        const sorted = [...electricians];

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
    }, [electricians, activeFilter]);

    // ── Guard renders ────────────────────────────────────────────────────────────

    // Render this block if `isLoading` is still true
    if (isLoading) {
        return (
            <div className="directory-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <p style={{ fontSize: '18px', color: '#0c3396', fontWeight: 600 }}>⏳ Loading service providers…</p>
            </div>
        );
    }

    // Render this block if an error string exists in state
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

    // Final UI assembly for valid state
    return (
        <div className="directory-container">
            {/* Return path mechanism */}
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

            {/* Directory Intro copy specific to Electrical work */}
            <header className="directory-header">
                <h1>Electrical Experts</h1>
                <p>Connect with verified professionals for safe and reliable wiring and electrical repairs.</p>
            </header>

            {/* Sorting options and dynamic list counter */}
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
                    <span className="verified-icon">✔</span> {electricians.length} Verified Electricians found
                </div>
            </div>

            <div className="cards-grid">
                {/* Conditional fallback for zero data rows */}
                {sortedElectricians.length === 0 && (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#555', fontSize: '16px', padding: '40px 0' }}>
                        No electrical service providers found at the moment. Please check back later.
                    </p>
                )}

                {/* Dynamic mapping loop converting sorted array entries to React nodes */}
                {sortedElectricians.map((provider) => (
                    <div className="profile-card" key={provider.id || provider.Email}>
                        <div className="card-body">
                            {/* Provider identity and aggregate score */}
                            <div className="card-header">
                                <h2>{provider.UserName}</h2>
                                <span className="rating-pill">⭐ {provider.rating || 'New'}</span>
                            </div>

                            {/* Categorization tag */}
                            <p className="role-text">{provider.serviceType || 'Electrician'}</p>

                            {/* Quick stats on tenure and proximity */}
                            <div className="meta-details">
                                <span>💼 {provider.Experience}</span>
                                <span>📍 {provider.City}</span>
                            </div>

                            {/* Bio blurb / string formatting fallback */}
                            <blockquote className="review-quote">
                                "{provider.quote || 'Expert electrical solutions for your home.'}"
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