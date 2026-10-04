import React, { useState , useEffect} from 'react';
import './SignUp.css';
import SignUpSuccess from './SignUpSucess'
import { Link , useNavigate} from 'react-router-dom' ;
import { useToast } from './Toast.jsx';
export default function SignUp() {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        UserName: "",
        Email: '',
        Password: '',
        userType: 'User', 
        phoneNumber: '',
        Address: '',
        serviceType: '',
        Experience: '',
        City: ''
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();
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

    const handleUserTypeChange = (selectedType) => {
        setFormData((currData) => {
            return {
                ...currData,
                userType: selectedType
            };
        });
    };
    const handleSubmit = async (event) => {
        event.preventDefault(); 
        try {
            const response = await fetch('http://localhost:8009/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                setShowSuccessModal(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                const errorData = await response.json();
                console.error("Signup failed:", errorData.message);
                showToast(errorData.message, 'error');
            }
        }
        catch(error){
            console.error("Network error:", error);
        }
    };
    
    return (
        <div className="signup-container">
            {showSuccessModal && <SignUpSuccess />}
            <div className="form-wrapper">
                <h2 className="brand-logo">ProFix</h2>
                <h1 className="main-heading">
                    {formData.userType === 'Service Provider' ? 'Partner with ProFix' : 'Create your account'}
                </h1>
                <p className="sub-heading">
                    {formData.userType === 'Service Provider' 
                        ? "Join India's premium network of service professionals. Grow your business with steady leads and reliable payouts."
                        : "Join India's most trusted network for premium home services."}
                </p>
                <form onSubmit={handleSubmit} className="signup-form">
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

                    <div className="input-group">
                        <label htmlFor="UserName">Full Name</label>
                        <input 
                            type='text' 
                            placeholder='e.g. Arjun Mehta' 
                            id='UserName'
                            name='UserName'
                            value={formData.UserName}
                            onChange={handleInputChange}
                            className="form-input"
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="Email">Email Address</label>
                        <input 
                            type='email' 
                            placeholder='arjun@example.com'
                            name='Email'
                            id='Email'
                            value={formData.Email}
                            onChange={handleInputChange}
                            className="form-input"
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="phoneNumber">Phone Number</label>
                        <div className="phone-input-wrapper">
                            <span className="country-code">+91</span>
                                <input 
                                    type='tel' 
                                    placeholder=' ex - 98765 43210'
                                    name='phoneNumber'
                                    id='phoneNumber'
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="phone-input"
                                />
                        </div>
                    </div>
                    <div className="input-group">
                        <label htmlFor="UserName">Password</label>
                        <input 
                            type='password' 
                            placeholder='enter password' 
                            id='Password'
                            name='Password'
                            value={formData.Password}
                            onChange={handleInputChange}
                            className="form-input"
                        />
                    </div>
                    {formData.userType === 'User' ? (
                        <>
                            <div className="input-group">
                                <label htmlFor="Address">Full Address</label>
                                <input 
                                    type='text' 
                                    placeholder='Enter your full address'
                                    name='Address'
                                    id='Address'
                                    value={formData.Address}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="two-column-grid">
                                <div className="input-group">
                                    <label htmlFor="serviceType">Primary Expertise</label>
                                    <div className="select-wrapper">
                                        <select 
                                            value={formData.serviceType} 
                                            onChange={handleInputChange} 
                                            id='serviceType' 
                                            name='serviceType'
                                            className="form-input"
                                        >
                                            <option value="" disabled>Select Category</option>
                                            <option value="Plumbing">Plumbing</option>
                                            <option value="Carpentry">Carpentry</option>
                                            <option value="HouseKeeping">Housekeeping</option>
                                            <option value="Electrician">Electrician</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="Experience">Years of Experience</label>
                                    <input 
                                        type='number' 
                                        placeholder='0'
                                        name='Experience'
                                        id='Experience'
                                        value={formData.Experience}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="City">Operating City</label>
                                <input 
                                    type='text' 
                                    placeholder='e.g. Mumbai, Delhi, Bengaluru'
                                    name='City'
                                    id='City'
                                    value={formData.City}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            </div>
                        </>
                    )}

                    {/* Submit Button */}
                    <button type="submit" className="submit-btn">
                        {formData.userType === 'Service Provider' ? 'Continue Application' : 'Sign Up Securely'}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                    <p className="footer-text">
                        Already have an account? <Link to="/login" className="login-link">Log in</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}