// Importing React, useState, and useEffect to build the component and manage state
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// Importing our necessary icons from lucide-react
import {
  LayoutGrid, ClipboardList, MessageSquare, Bell, Wrench, Brush,
  Hammer, Zap, Clock, CircleUser, LogOut, X, CheckCircle2, AlertCircle
} from 'lucide-react';
// Importing the CSS stylesheet for this dashboard layout
import './User_dashboard.css';
// Importing the UserProfile popup component
import UserProfile from './User_profile.jsx';
// FIX #16: Toast notifications
import { useToast } from './Toast.jsx';

// The main default export that App.jsx is looking for
export default function HomeServDashboard() {
  // FIX #1: useNavigate must be INSIDE the component, not at module level
  const navigate = useNavigate();
  // 1. STATE: Create a state variable to hold the username once fetched
  const [userName, setUserName] = useState('');
  // STATE: Controls whether the UserProfile popup is visible
  const [showProfile, setShowProfile] = useState(false);
  // FIX #12: State for notification bell dropdown
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // 2. CREDENTIALS: Add credentials: 'include' so the backend receives the session cookie
        const response = await fetch('http://localhost:8009/User_dashboard', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse the JSON object sent by the backend
        const data = await response.json();
        // 3. UPDATE STATE: Save the retrieved name to our React state
        setUserName(data.userName);
      } catch (error) {
        console.error("Could not fetch the data:", error);
      }
    };

    fetchProfileData();

    // FIX #12: Fetch recent notifications (bookings) for the bell
    const fetchNotifications = async () => {
      try {
        const res = await fetch('http://localhost:8009/my_bookings', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Show only the 5 most recent bookings as notifications
          const recentBookings = (data.bookings || []).slice(0, 5).map(b => ({
            id: b.id,
            text: `Booking #PRFX-${String(b.id).padStart(4,'0')} — ${b.serviceType} is ${b.status}`,
            status: b.status,
          }));
          setNotifications(recentBookings);
        }
      } catch { /* silent fail */ }
    };
    fetchNotifications();
  }, []); // Empty array ensures this only runs once on load

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation component */}
      <Sidebar navigate={navigate} />
      {/* Main content area that sits to the right of the sidebar */}
      <main className="main-content">
        {/* 4. PROPS: Pass the userName state down to the Header component */}
        <Header
          userName={userName}
          onProfileClick={() => setShowProfile(true)}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          notifications={notifications}
        />
        <div className="content-scroll-area">
          {/* 4. PROPS: Pass the userName state down to the HeroBanner component */}
          <HeroBanner userName={userName} />
          <ServicesGrid />
        </div>
      </main>

      {/* UserProfile popup overlay - shown when the profile icon is clicked */}
      {showProfile && (
        <div className="profile-overlay" onClick={() => setShowProfile(false)}>
          <div className="profile-overlay-content" onClick={(e) => e.stopPropagation()}>
            <UserProfile onClose={() => setShowProfile(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// FIX #1 + #2: Sidebar receives navigate as prop (no module-level useNavigate)
function Sidebar({ navigate }) {
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:8009/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        navigate('/login');
      } else {
        showToast('Failed to logout. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    }
  };

  // Renders the left-hand navigation pane
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>ProFix</h2>
      </div>
      <nav className="sidebar-nav" style={{ flex: 1 }}>
        <a href="#" className="nav-item active">
          <LayoutGrid size={20} />
          <span>Home</span>
        </a>
        {/* FIX #11: My Requests now links to the real /my_requests page */}
        <a
          href="#"
          className="nav-item"
          onClick={(e) => { e.preventDefault(); navigate('/my_requests'); }}
        >
          <ClipboardList size={20} />
          <span>My Requests</span>
        </a>
        {/* FIX #2: Wrap navigate in arrow function so it only fires on click */}
        <button
          className="nav-item"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            width: '100%', textAlign: 'left', fontFamily: 'inherit',
            color: 'inherit', padding: '12px 16px'
          }}
          onClick={() => navigate('/chat')}
        >
          <MessageSquare size={20} />
          <span>Chats</span>
        </button>
      </nav>
      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <button
          onClick={handleLogout}
          className="nav-item logout-btn"
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            fontWeight: '500',
            borderRadius: '8px',
            fontFamily: 'inherit'
          }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

// FIX #12: Header now accepts notification state and renders a dropdown
function Header({ userName, onProfileClick, showNotifications, setShowNotifications, notifications }) {
  const bellRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowNotifications]);

  const statusIcon = (status) => {
    if (status === 'Accepted' || status === 'Completed') return <CheckCircle2 size={13} color="#065f46" />;
    if (status === 'Declined') return <X size={13} color="#991b1b" />;
    return <AlertCircle size={13} color="#92400e" />;
  };

  return (
    <header className="header" style={{ justifyContent: 'flex-end' }}>
      <div className="user-profile">
        {/* FIX #12: Bell button now shows a notification dropdown */}
        <div className="notif-wrapper" ref={bellRef} style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setShowNotifications(prev => !prev)}
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="notif-dot" style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#ef4444', border: '2px solid white'
              }} />
            )}
          </button>
          {showNotifications && (
            <div className="notif-dropdown" style={{
              position: 'absolute', top: '44px', right: 0,
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              minWidth: '300px', zIndex: 1000, overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
                Recent Activity
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '20px 16px', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>
                  No recent activity
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f8fafc', fontSize: '13px', color: '#334155' }}>
                    {statusIcon(n.status)}
                    <span>{n.text}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="profile-info">
          <div className="profile-text">
            <span className="profile-name">{userName || 'Loading...'}</span>
          </div>
          <button className="icon-btn profile-icon-btn" onClick={onProfileClick} aria-label="Open Profile">
            <CircleUser size={28} className="profile-icon-svg" />
          </button>
        </div>
      </div>
    </header>
  );
}

function HeroBanner({ userName }) {
  return (
    <section className="hero-banner">
      <div className="hero-content">
        <h1>Namaste, {userName || 'User'}!</h1>
        <p>Your comfort is our command.</p>
      </div>
      <div className="hero-graphic">
        <div className="graphic-placeholder"></div>
      </div>
    </section>
  );
}

function ServicesGrid() {
  const navigate = useNavigate();

  const services = [
    { id: 1, title: 'Plumbing', price: '₹299', icon: <Wrench size={24} />, colorClass: 'icon-blue', onClick: () => { navigate('/Service_Plumbing') } },
    { id: 2, title: 'Housekeeping', price: '₹499', icon: <Brush size={24} />, colorClass: 'icon-green', onClick: () => { navigate('/Service_HouseKeeping') } },
    { id: 3, title: 'Carpentry', price: '₹599', icon: <Hammer size={24} />, colorClass: 'icon-orange', onClick: () => { navigate('/Service_Carpentry') } },
    { id: 4, title: 'Electrician', price: '₹199', icon: <Zap size={24} />, colorClass: 'icon-purple', onClick: () => { navigate('/Service_Electrician') } },
  ];

  return (
    <section className="services-section">
      <div className="services-layout-wrapper">
        <div className="services-top-header">
          <h3 className="section-title">Book a New Service</h3>
        </div>
        <div className="cards-container">
          {services.map((service) => (
            <div key={service.id} className="service-card" onClick={service.onClick}>
              <div className={`service-icon ${service.colorClass}`}>
                {service.icon}
              </div>
              <h4>{service.title}</h4>
              <p>Starting at {service.price}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}