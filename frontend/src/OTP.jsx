// OTP.jsx — FIX #13: 60-second resend cooldown + OTP expiry display
//             FIX #16: Replace alert() with toast notifications
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast.jsx';
import './OTP.css';

const COOLDOWN_SECONDS = 60;

export default function OTP() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [otp, setOtp] = useState(new Array(4).fill(""));
    const inputRefs = useRef([]);

    // FIX #13: Countdown timer state
    const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS); // Start counting down immediately
    const timerRef = useRef(null);

    // Start cooldown on mount (OTP was just sent by the previous page)
    useEffect(() => {
        startCooldown();
        return () => clearInterval(timerRef.current);
    }, []);

    const startCooldown = () => {
        setCooldown(COOLDOWN_SECONDS);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return;
        const newOtp = [...otp];
        newOtp[index] = element.value.substring(element.value.length - 1);
        setOtp(newOtp);
        if (element.value !== "" && index < 3) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalOtp = otp.join("");
        if (finalOtp.length < 4) {
            showToast("Please enter the full 4-digit code.", "warning");
            return;
        }
        try {
            const response = await fetch('http://localhost:8009/otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ otp: finalOtp })
            });

            if (response.ok) {
                showToast("OTP verified successfully!", "success");
                navigate('/newpassword');
            } else {
                const data = await response.json();
                // Show specific message for expired OTP
                showToast(data.message, 'error');
                // Clear OTP inputs
                setOtp(new Array(4).fill(""));
                inputRefs.current[0]?.focus();
            }
        }
        catch (error) {
            console.error("Verification error:", error);
            showToast("Network error. Please try again.", "error");
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return; // Guard: button should be disabled, but double-check

        setOtp(new Array(4).fill(""));
        inputRefs.current[0].focus();

        try {
            const response = await fetch('http://localhost:8009/resend-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({})
            });

            if (response.ok) {
                showToast("A new 4-digit code has been sent to your email.", "success");
                // FIX #13: Restart the 60-second cooldown
                startCooldown();
            } else {
                showToast("Failed to resend the code. Please try again.", "error");
            }
        } catch (error) {
            console.error("Error resending OTP:", error);
            showToast("Network error. Please try again.", "error");
        }
    };

    return (
        <div className="verify-container">
            <header className="brand-header">
                <span className="brand-logo">ProFix</span>
            </header>
            <main className="verify-wrapper">
                <h1 className="main-heading">Verify your account</h1>
                <p className="description-text">
                    We've sent a 4-digit code to your email. Please enter it below to proceed.
                    <br />
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>This code expires in 10 minutes.</span>
                </p>
                <form onSubmit={handleSubmit} className="verify-form">
                    <div className="otp-container">
                        {otp.map((data, index) => {
                            return (
                                <input
                                    key={index}
                                    type="text"
                                    ref={(ref) => inputRefs.current[index] = ref}
                                    value={data}
                                    onChange={(e) => handleChange(e.target, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className="otp-input"
                                    maxLength="1"
                                    inputMode="numeric"
                                />
                            );
                        })}
                    </div>
                    <button type="submit" className="submit-btn">
                        Verify &amp; Proceed
                    </button>
                </form>

                <div className="resend-container">
                    <p className="resend-text">
                        Didn't receive the code?{' '}
                        {cooldown > 0 ? (
                            // FIX #13: Show countdown, disable button
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                                Resend in <strong>{cooldown}s</strong>
                            </span>
                        ) : (
                            <button
                                type="button"
                                className="resend-link active"
                                onClick={handleResend}
                            >
                                Resend Code
                            </button>
                        )}
                    </p>
                </div>
            </main>
        </div>
    );
}