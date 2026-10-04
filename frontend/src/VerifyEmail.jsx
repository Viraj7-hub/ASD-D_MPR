import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './VerifyEmail.css';

export default function VerifyEmail() {
    const navigate = useNavigate();
    const [contactInfo, setContactInfo] = useState('');
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('http://localhost:8009/verifyemail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // CRITICAL FIX: Required to establish the session cookie in the browser
                credentials: 'include', 
                body: JSON.stringify({ Email: contactInfo })
            });
            if (response.ok) {
                navigate('/otp');
            } else {
                const data = await response.json();
                alert(data.message);
            }
        }
        catch (error) {
            console.log(error);
        }
    };

    // ... (Your return statement and JSX remains exactly the same)
    return (
        <div className="reset-container">
            <header className="brand-header">
                <span className="brand-logo">ProFix</span>
            </header>
            <main className="form-wrapper">
                <h1 className="main-heading">Reset your password</h1>
                <p className="description-text">
                    Enter the email address  associated with your account and we'll send you a OTP to reset your password.
                </p>
                <form className="reset-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="contactInfo" className="input-label">
                            Email 
                        </label>
                        <input 
                            type="text" 
                            id="contactInfo"
                            placeholder="arjun@example.com"
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>
                    <button type="submit" className="submit-btn">
                        Send OTP on Email
                        <span className="arrow-icon">&rarr;</span>
                    </button>
                </form>
                <div className="back-link-container">
                    <Link to="/login" className="back-link">
                        <span className="arrow-icon">&larr;</span> Back to Login
                    </Link>
                </div>
            </main>
        </div>
    );
}