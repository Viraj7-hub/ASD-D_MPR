
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import LoginSuccess from './LoginSuccess.jsx';
import { useToast } from './Toast.jsx';

export default function Login() {
    const { showToast } = useToast();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();
    const handlelogin = () => {
        setShowSuccessModal(true);
    }
    const [formData, setFormData] = useState({
        userType: 'User',
        Email: '',
        Password: ''
    });
    const handleInputChange = (event) => {
        const fieldName = event.target.name;
        const newValue = event.target.value;
        setFormData((currData) => {
            return {
                ...currData,
                [fieldName]: newValue
            };
        });
    };

    const handleUserTypeChange = (type) => {
        setFormData((currData) => ({
            ...currData,
            userType: type
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('http://localhost:8009/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                handlelogin();
                {
                    setTimeout(() => {
                        if (formData.userType === 'User') {
                            navigate('/User_dashboard');
                        }
                        else {
                            navigate('/Provider_dashboard');
                        }

                    }, 3000);
                }
            }
            else {
                const errorData = await response.json();
                console.error("Login failed:", errorData.message);
                showToast(errorData.message, 'error');
            }
        }
        catch (error) {
            console.log(error);
            return;
        }
    };

    return (
        <div className="login-container">
            {showSuccessModal && <LoginSuccess />}
            <div className="form-wrapper">
                <h1 className="main-heading">Login</h1>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <div className="user-type-selector">
                            <label className="type-label">
                                <input
                                    type="checkbox"
                                    name="userType"
                                    checked={formData.userType === 'User'}
                                    onChange={() => handleUserTypeChange('User')}
                                    className="custom-checkbox"
                                />
                                User
                            </label>
                            <label className="type-label">
                                <input
                                    type="checkbox"
                                    name="userType"
                                    checked={formData.userType === 'Service Provider'}
                                    onChange={() => handleUserTypeChange('Service Provider')}
                                    className="custom-checkbox"
                                />
                                Service Provider
                            </label>
                        </div>
                        <label htmlFor="Email" className="input-label">Please enter your Email Id</label>
                        <input
                            type='email'
                            placeholder='Enter Email Id'
                            name='Email'
                            id='Email'
                            value={formData.Email}
                            onChange={handleInputChange}
                            className="form-input"
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="Password" className="input-label">Please enter your Password</label>
                        <input
                            type='password'
                            placeholder='Enter your Password'
                            name='Password'
                            id='Password'
                            value={formData.Password}
                            onChange={handleInputChange}
                            className="form-input"
                        />
                    </div>
                    <button type="submit" className="submit-btn">Submit</button>
                </form>
                <p className="footer-text">
                    Don't have an account? <Link to='/signup' className="signup-link">SignUp</Link>
                </p>
                <p className="footer-text"> <Link to='/verifyemail'>Forgot Password</Link></p>
            </div>
        </div>
    );
}