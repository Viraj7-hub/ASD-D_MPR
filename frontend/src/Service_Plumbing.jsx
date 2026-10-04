// Importing React and necessary hooks (useState for state management, useEffect for side effects like fetching data)
import React, { useState, useEffect, useMemo } from 'react';
// useNavigate lets us redirect to another page programmatically
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Importing the external stylesheet for our styles
import './ServiceDirectory.css';

// ── Helper: Parse a numeric year value from strings like "5 years", "10 Years", "3" ──
function parseExperienceYears(exp) {
  if (!exp) return 0;
  const match = String(exp).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Main Component that houses the entire directory layout
export default function PlumberDirectory() {
  const navigate = useNavigate();

  // Called when the user clicks "Book" on a provider card.
  // We pass the full plumber object as route state so Booking.jsx can read it
  // via useLocation().state.providerData — no extra API call needed.
  // FIX #9: Separate chat and booking actions
  const handleChatClick = (plumber) => {
    navigate('/chat', { state: { providerData: plumber } });
  };

  const handleBookClick = (plumber) => {
    navigate('/booking', { state: { providerData: plumber } });
  };

  // State to hold the array of plumber data fetched from the API (starts as an empty array)
  const [plumbers, setPlumbers] = useState([]);

  // State to track if the application is currently fetching data (starts as true)
  const [isLoading, setIsLoading] = useState(true);

  // State to hold any error messages that might occur during the fetch process (starts as null)
  const [error, setError] = useState(null);

  // State to track which filter button is currently active
  const [activeFilter, setActiveFilter] = useState('top_rated');

  // useEffect runs once when the component first mounts to the screen
  useEffect(() => {
    // Defining an asynchronous function to handle the API request
    const fetchPlumbers = async () => {
      try {
        // Making the GET request to your Express API endpoint
        // 'credentials: "include"' is mandatory here because your backend checks req.session
        const response = await fetch('http://localhost:8009/Service_Plumbing', {
          method: 'GET',
          credentials: 'include',
        });

        // Parsing the JSON response from the backend
        const result = await response.json();
        console.log('API response:', result); // DEBUG: inspect what the server returns

        // Checking if the HTTP status code is NOT in the 200-299 success range
        if (!response.ok) {
          // If it's a 401 Unauthorized (from your backend session check), throw a specific error
          throw new Error(result.message || 'Failed to fetch data from the server');
        }

        // If successful, update the plumbers state with the 'data' array from your backend response
        setPlumbers(result.data || []);

      } catch (err) {
        // If the fetch fails or an error is thrown above, update the error state
        setError(err.message);
      } finally {
        // Regardless of success or failure, turn off the loading state once the process finishes
        setIsLoading(false);
      }
    };

    // Calling the fetch function we just defined
    fetchPlumbers();

  }, []); // The empty dependency array ensures this only runs once on initial load

  // ── Sorting logic: useMemo recalculates only when plumbers or activeFilter changes ──
  const sortedPlumbers = useMemo(() => {
    // Create a shallow copy to avoid mutating the original state array
    const sorted = [...plumbers];

    switch (activeFilter) {
      case 'top_rated':
        // Sort by rating descending (highest first). Providers without a rating go last.
        sorted.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
        break;
      case 'city':
        // Sort alphabetically by City name (A → Z)
        sorted.sort((a, b) => (a.City || '').localeCompare(b.City || ''));
        break;
      case 'experience':
        // Sort by experience years descending (most experienced first)
        sorted.sort((a, b) => parseExperienceYears(b.Experience) - parseExperienceYears(a.Experience));
        break;
      default:
        break;
    }

    return sorted;
  }, [plumbers, activeFilter]);

  // ── Guard renders ────────────────────────────────────────────────────────────
  // Show a loading spinner while the API call is in-flight
  if (isLoading) {
    return (
      <div className="directory-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ fontSize: '18px', color: '#0c3396', fontWeight: 600 }}>⏳ Loading service providers…</p>
      </div>
    );
  }

  // Show the error message if the fetch failed (e.g. 401 Unauthorized / network error)
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

  return (
    // Main container wrapping the page content
    <div className="directory-container">
      <button
        onClick={() => navigate('/User_dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#0c3396',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '20px',
          padding: '0'
        }}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Header section displaying the title and subtitle */}
      <header className="directory-header">
        <h1>Plumbing Experts</h1>
        <p>Connect with verified professionals for all your home maintenance needs.</p>
      </header>

      {/* Filter bar containing sorting options and results count */}
      <div className="filter-bar">
        <div className="filter-options">
          <span className="filter-label">Filter by:</span>
          {/* Each button sets activeFilter state and gets the 'active' class conditionally */}
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

        {/* Results counter dynamically updated based on the length of the fetched array */}
        <div className="results-count">
          <span className="verified-icon">✔</span> {plumbers.length} Verified Plumbers found
        </div>
      </div>

      {/* Grid container to hold all profile cards and the support card */}
      <div className="cards-grid">

        {/* Show a message if no plumbers are found after a successful fetch */}
        {sortedPlumbers.length === 0 && (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#555', fontSize: '16px', padding: '40px 0' }}>
            No plumbing service providers found at the moment. Please check back later.
          </p>
        )}

        {/* Mapping through the sorted plumbers array */}
        {sortedPlumbers.map((plumber) => (

          // Using the database ID as the unique React key
          <div className="profile-card" key={plumber.id || plumber.Email}>
            {/* Main content body of the card */}
            <div className="card-body">
              {/* Header row with Name and Rating */}
              <div className="card-header">
                <h2>{plumber.UserName}</h2>
                <span className="rating-pill">⭐ {plumber.rating || 'New'}</span>
              </div>

              {/* Role description pulled from the database */}
              <p className="role-text">{plumber.serviceType || 'Plumber'}</p>

              {/* Meta details: Experience and Location */}
              <div className="meta-details">
                <span>💼 {plumber.Experience}</span>
                <span>📍 {plumber.City}</span>
              </div>

              {/* Customer review quote */}
              <blockquote className="review-quote">
                "{plumber.quote || 'Ready to help with your plumbing needs.'}"
              </blockquote>
              {/* FIX #9: Two separate buttons — Chat and Book Now */}
              <div className="card-footer" style={{ gap: '8px' }}>
                <button
                  className="book-btn chat-btn"
                  onClick={() => handleChatClick(plumber)}
                  style={{ background: '#f0f4ff', color: '#0c3396', border: '1.5px solid #c3d2f2' }}
                >
                  💬 Chat
                </button>
                <button
                  className="book-btn"
                  onClick={() => handleBookClick(plumber)}
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