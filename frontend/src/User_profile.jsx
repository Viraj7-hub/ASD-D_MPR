// 1. FIXED: Imported useState alongside useEffect
import React, { useEffect, useState } from 'react'; 
import './User_profile.css';
import UpdateProfile from './UpdateProfile.jsx'
export default function UserProfile({ onClose }) {
    const [profileData, setProfileData] = useState(null);
    const [updateProfile , setupdateProfile] = useState(false);
    const handleupdateProfile = () => {
        setupdateProfile(true);
    }
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const response = await fetch('http://localhost:8009/user_profile', {
                    credentials: 'include'
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                setProfileData(data);
            } catch(error) {
                console.error("Could not fetch the data:", error);
            }
        };
        fetchProfileData();
    // 2. FIXED: Added the empty array so this only runs ONCE
    }, []); 

    // 3. FIXED: Added a loading check. 
    // If profileData is still null, show a loading message instead of crashing.
    if (!profileData) {
        return (
            <div className="profile-popup-container" style={{ padding: '24px', textAlign: 'center' }}>
                <p>Loading Profile...</p>
            </div>
        );
    }

  return (
    <>
      <div className="profile-popup-container">
        <button className="close-popup-btn" onClick={onClose} aria-label="Close Popup">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="popup-content">
        
          {/* Form Group 1: User Name */}
          <div className="form-group">
            {/* 4 & 5. FIXED: Put 'User Name' in the label, and profileData.name in the span */}
            <label>User Name</label>
            <div className="input-display">
              <svg className="field-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="field-text">{profileData.name}</span>
            </div>
          </div>

          {/* Form Group 2: Email Address */}
          <div className="form-group">
            {/* 4. FIXED: Added the label text, and used profileData.email (lowercase) */}
            <label>Email Address</label>
            <div className="input-display">
              <svg className="field-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="field-text">{profileData.email}</span>
            </div>
          </div>

          {/* Form Group 3: Phone Number */}
          <div className="form-group">
            <label>Phone Number</label>
            <div className="input-display">
              <svg className="field-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {/* 4. FIXED: Changed phoneNumber to phone to match backend */}
              <span className="field-text">{profileData.phone}</span>
            </div>
          </div>

          {/* Form Group 4: Primary Address */}
          <div className="form-group">
            <label>Primary Address</label>
            <div className="input-display align-top">
              <svg className="field-icon mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {/* 4. FIXED: Changed Address to address to match backend */}
              <span className="field-text">{profileData.address}</span>
            </div>
          </div>
        </div>
      
        <div className="popup-footer">
          <button 
          className="edit-profile-btn"
          onClick = {handleupdateProfile}
          >
            Edit Profile Details
          </button>
        </div>
      </div>

      {/* Render UpdateProfile OUTSIDE the profile-popup-container to avoid z-index stacking issues */}
      {updateProfile && (
        <UpdateProfile 
          isOpen={updateProfile} 
          onClose={() => setupdateProfile(false)} 
        />
      )}
    </>
  );
}