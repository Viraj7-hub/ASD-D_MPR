// Importing React and necessary hooks (useState for state management, useEffect for fetching data)
import React, { useState, useEffect, useMemo } from 'react';
// useNavigate lets us redirect back to the dashboard or to the chat page
import { useNavigate } from 'react-router-dom';
// Importing the ArrowLeft icon for the back button
import { ArrowLeft } from 'lucide-react';

// Importing the shared external stylesheet for all service directories
import './ServiceDirectory.css';

// ── Helper: Parse a numeric year value from strings like "5 years", "10 Years", "3" ──
function parseExperienceYears(exp) {
    if (!exp) return 0;
    const match = String(exp).match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

// Main Component that houses the Carpentry directory layout
export default function CarpenterDirectory() {
    // Initialize the navigate function from React Router
    const navigate = useNavigate();

    // Redirects user to the chat page, passing the specific provider's data along
    // FIX #9: Separate chat and booking actions
    const handleChatClick = (provider) => {
        navigate('/chat', { state: { providerData: provider } });
    };

    const handleBookClick = (provider) => {
        navigate('/booking', { state: { providerData: provider } });
    };

    // State to hold the array of carpenter data fetched from the API
    const [carpenters, setCarpenters] = useState([]);

    // State to track if the application is currently fetching data
    const [isLoading, setIsLoading] = useState(true);

    // State to hold any error messages that might occur during the fetch
    const [error, setError] = useState(null);

    // State to track which filter is currently active
    const [activeFilter, setActiveFilter] = useState('top_rated');

    // useEffect runs once when the component first mounts
    useEffect(() => {
        // Asynchronous function to handle the API request for carpenters
        const fetchCarpenters = async () => {
            try {
                // Making the GET request to the Carpentry endpoint
                // 'credentials: "include"' is required to pass session cookies
                const response = await fetch('http://localhost:8009/Service_Carpentry', {
                    method: 'GET',
                    credentials: 'include',
                });

                // Parsing the JSON response from the backend
                const result = await response.json();

                // Checking if the HTTP status code indicates a failure
                if (!response.ok) {
                    throw new Error(result.message || 'Failed to fetch data from the server');
                }

                // Updating state with the fetched array of carpenters
                setCarpenters(result.data || []);

            } catch (err) {
                // Catch and store any errors in state to display to the user
                setError(err.message);
            } finally {
                // Turn off the loading spinner once the request finishes
                setIsLoading(false);
            }
        };

        // Trigger the fetch operation
        fetchCarpenters();
    }, []); // Empty dependency array ensures this runs only once

    // ── Sorting logic: useMemo recalculates only when data or filter changes ──
    const sortedCarpenters = useMemo(() => {
        const sorted = [...carpenters];

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
    }, [carpenters, activeFilter]);

    // ── Guard renders ────────────────────────────────────────────────────────────

    // Show a loading state while fetching data
    if (isLoading) {
        return (
            <div className="directory-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <p style={{ fontSize: '18px', color: '#0c3396', fontWeight: 600 }}>⏳ Loading service providers…</p>
            </div>
        );
    }

    // Show an error state with a retry button if the fetch fails
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

    // Main UI Render
    return (
        <div className="directory-container">
            {/* Back button to return to the user dashboard */}
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

            {/* Page Header specific to Carpentry */}
            <header className="directory-header">
                <h1>Carpentry Experts</h1>
                <p>Connect with verified professionals for custom woodwork, repairs, and furniture assembly.</p>
            </header>

            {/* Filter and stats bar */}
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

                {/* Dynamic count based on fetched array length */}
                <div className="results-count">
                    <span className="verified-icon">✔</span> {carpenters.length} Verified Carpenters found
                </div>
            </div>

            <div className="cards-grid">
                {/* Empty state if no carpenters are returned from the database */}
                {sortedCarpenters.length === 0 && (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#555', fontSize: '16px', padding: '40px 0' }}>
                        No carpentry service providers found at the moment. Please check back later.
                    </p>
                )}

                {/* Iterate over the sorted array and render a card for each carpenter */}
                {sortedCarpenters.map((provider) => (
                    <div className="profile-card" key={provider.id || provider.Email}>
                        <div className="card-body">
                            {/* Name and dynamic rating */}
                            <div className="card-header">
                                <h2>{provider.UserName}</h2>
                                <span className="rating-pill">⭐ {provider.rating || 'New'}</span>
                            </div>

                            {/* Service role text */}
                            <p className="role-text">{provider.serviceType || 'Carpenter'}</p>

                            {/* Experience and Location details */}
                            <div className="meta-details">
                                <span>💼 {provider.Experience}</span>
                                <span>📍 {provider.City}</span>
                            </div>

                            {/* Dynamic quote or fallback text */}
                            <blockquote className="review-quote">
                                "{provider.quote || 'Ready to help with your woodwork needs.'}"
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