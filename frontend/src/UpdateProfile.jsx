import React, { useEffect, useState } from 'react';
import './UpdateProfile.css';
import { useToast } from './Toast.jsx';

export default function ProfileUpdateModal({ isOpen, onClose }) {
  const { showToast } = useToast();
  // 1. STATE: Store the original data fetched from the database.
  // We keep this separate so we always have a clean copy to revert to.
  const [originalData, setOriginalData] = useState(null);

  // 2. STATE: Store the data the user is currently editing.
  // We initialize it as an empty object until the fetch completes.
  const [formData, setFormData] = useState({});

  // 3. STATE: Controls the visibility of the "Discard changes?" prompt.
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  useEffect(() => {
    // Only fetch data if the modal is actually open
    if (isOpen) {
      const fetchProfileData = async () => {
        try {
          // Make sure this route matches your Express backend
          const response = await fetch('http://localhost:8009/user_profile', {
            credentials: 'include'
          });
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();

          // When data arrives, save it to BOTH state variables.
          // originalData acts as our backup. formData is what gets edited.
          setOriginalData(data);
          setFormData(data);
        } catch (error) {
          console.error("Could not fetch the data:", error);
        }
      };
      
      fetchProfileData();
    }
  }, [isOpen]); // The effect runs whenever the modal opens

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Update the editable formData state
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // 1. Send the updated data to the backend
      const response = await fetch('http://localhost:8009/userprofile_update', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        // Convert the React state object into a JSON string for the server to read
        body: JSON.stringify(formData), 
      });

      // 2. Check if the server accepted the update
      if (!response.ok) {
        throw new Error(`Failed to update profile. Status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Server response:", result);
      setOriginalData(formData);
      showToast('Profile updated successfully!', 'success');
      onClose();

    } catch (error) {
      console.error("Error updating profile:", error);
      showToast('There was an error saving your changes. Please try again.', 'error');
    }
  };
  // CROSS ICON: Immediate exit. Revert data and close.
  const handleClose = () => {
    if (originalData) {
      setFormData(originalData); // Revert any unsaved changes
    }
    setShowConfirmCancel(false);
    onClose();
  };

  // CANCEL BUTTON: Show the confirmation prompt
  const handleCancelClick = () => {
    setShowConfirmCancel(true);
  };

  // DISCARD CHANGES: User confirmed they want to lose their edits.
  const confirmDiscard = () => {
    if (originalData) {
      setFormData(originalData); // Revert to the clean backup
    }
    setShowConfirmCancel(false);
    onClose();
  };

  // CONTINUE EDITING: Hide the prompt, keep the edits.
  const abortCancel = () => {
    setShowConfirmCancel(false);
  };

  // If the modal is closed, or if we haven't fetched data yet, don't render the form.
  if (!isOpen || !originalData) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        
        {/* Header Section */}
        <header className="modal-header">
          <div className="header-info">
            <div className="avatar-wrapper">
              {/* FIX #10: Replace broken via.placeholder.com with initials avatar */}
              <div className="avatar-img" style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #0c3396, #1d4ed8)',
                color: '#fff', fontWeight: 700, fontSize: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {(formData.name || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="verified-badge">
                <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            <div className="header-text">
              <h2>Update Profile</h2>
            </div>
          </div>
          
          <button className="close-x-btn" onClick={handleClose} aria-label="Close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Body / Form Section */}
        <div className="modal-body">
          <div className="form-group">
            <label>User Name</label>
            <div className="input-box">
              <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              {/* Ensure the 'name' attribute exactly matches the key returned by your backend */}
              <input type="text" name="name" value={formData.name || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-box">
              <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {/* Using formData.email here assuming your backend returns 'email' */}
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <div className="input-box">
              <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {/* Ensure the 'name' attribute exactly matches the key returned by your backend */}
              <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <div className="input-box align-top">
              <svg className="input-icon mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {/* Ensure the 'name' attribute exactly matches the key returned by your backend */}
              <textarea name="address" rows="2" value={formData.address || ''} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Footer Section with Conditional Rendering */}
        <div className="modal-footer">
          {showConfirmCancel ? (
            <div className="confirmation-box">
              <p className="confirmation-text">Discard unsaved changes?</p>
              <div className="confirmation-actions">
                <button 
                  onClick={confirmDiscard} 
                  style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontWeight: 500 }}
                >
                  Yes, Discard
                </button>
                <button 
                  onClick={abortCancel} 
                  style={{ flex: 1, padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontWeight: 500 }}
                >
                  No, Keep Editing
                </button>
              </div>
            </div>
          ) : (
            <>
              <button className="btn-primary" onClick={handleSave}>
                Save Changes
              </button>
              <button className="btn-secondary" onClick={handleCancelClick}>
                Cancel
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}