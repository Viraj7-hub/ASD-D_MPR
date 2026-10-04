import React, { useState } from 'react';
import './NewPassword.css';
// CRITICAL FIX: Added brackets
import { useNavigate } from 'react-router-dom'; 

export default function CreateNewPassword() {
    // CRITICAL FIX: Added 'const'
    const navigate = useNavigate(); 
    
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setPasswords((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // CRITICAL FIX: Added 'async' keyword
    const handleSubmit = async (event) => { 
        event.preventDefault();
        
        if (passwords.newPassword !== passwords.confirmPassword) {
            alert("Passwords do not match. Please try again.");
            return;
        }
        
        try {
            const response = await fetch('http://localhost:8009/newpassword', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                // CRITICAL FIX: Include session cookie
                credentials: 'include', 
                // CRITICAL FIX: Only send the string of the new password, not the whole state object
                body: JSON.stringify({ Password: passwords.newPassword }) 
            });
            
            if (response.ok) {
                alert("Password successfully reset");
                navigate('/login');
            } else {
                const data = await response.json();
                alert(data.message);
            }
        }
        catch (error) {
            console.log(error);
            alert("Error updating password , please try again");
        }
    };

    // ... (Your return statement and JSX remains exactly the same)
    return (
        <div className="cnp-container">
            <div className="cnp-wrapper">
                <header className="cnp-header">
                    <div className="brand-logo-group">
                        <svg className="profix-icon" width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="36" height="36" rx="8" fill="#6378CE"/>
                            <path d="M23.5 10.5C22.6716 10.5 22 11.1716 22 12C22 12.8284 22.6716 13.5 23.5 13.5C24.3284 13.5 25 12.8284 25 12C25 11.1716 24.3284 10.5 23.5 10.5ZM21.55 15.45L12 25L10 23L19.55 13.45C19.1966 12.6074 19.3248 11.6033 19.9234 10.8711C20.7303 9.88414 22.1802 9.72124 23.1611 10.5074L24.4926 9.17581L25.8242 10.5074L24.4926 11.8389C25.2788 12.8198 25.1159 14.2697 24.1289 15.0766C23.3967 15.6752 22.3926 15.8034 21.55 15.45Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="brand-text">ProFix</span>
                    </div>
                </header>

                <main className="cnp-main-content">
                    <h1 className="main-heading">Create New Password</h1>
                    <p className="description-text">
                        Set a strong password to protect your account and keep your data secure.
                    </p>
                    
                    <form onSubmit={handleSubmit} className="cnp-form">
                        <div className="input-group">
                            <label htmlFor="newPassword" className="input-label">New Password</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type="password" 
                                    id="newPassword"
                                    name="newPassword"
                                    placeholder="••••••••"
                                    value={passwords.newPassword}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="confirmPassword" className="input-label">Confirm New Password</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type="password" 
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    value={passwords.confirmPassword}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="cnp-submit-btn">
                            Update Password & Login
                        </button>
                    </form>
                </main>
            </div>
        </div>
    );
}