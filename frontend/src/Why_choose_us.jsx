// Importing React and the external CSS file for styling
import React from 'react';
import './Why_choose_us.css';

// Exporting the Services component
export default function Why_choose_us() {
    return (
        <section className="services-section" id='why_choose_us'>
            
            {/* The image container section remains completely unchanged */}
            <div className="services-images-container">
                <img 
                    src='/img2.png'
                    alt='Blueprint planning'
                    className='demo-image-1'
                />
                <img 
                    src='/img3.png'
                    alt='Finished living room'
                    className='demo-image-2'
                />
            </div>
            <div className="services-text-content">
                <h2 className="services-heading">Why Choose Us</h2>
                <p className="services-subheading">
                    We act as your trusted concierge, simplifying complex
                    service procurement into a seamless, high-quality experience.
                </p>
                <div className="services-list">
                    <div className="service-item">
                        <img src='/img4.png' alt='Verified Pros Icon' className='service-icon' />
                        <div className="service-item-text">
                            <h3>Verified Pros</h3>
                            <p>Every technician undergoes a rigorous background check and skills verification process.</p>
                        </div>
                    </div>
                    <div className="service-item">
                        <img src='/img5.png' alt='Transparent Pricing Icon' className='service-icon' />
                        <div className="service-item-text">
                            <h3>Transparent Pricing</h3>
                            <p>No hidden fees. See upfront estimates and hourly rates before you book.</p>
                        </div>
                    </div>
                    <div className="service-item">
                        <img src='/img6.png' alt='Guaranteed Work Icon' className='service-icon' />
                        <div className="service-item-text">
                            <h3>Guaranteed Work</h3>
                            <p>Your satisfaction is our priority. Projects are backed by our ProFix Guarantee.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}