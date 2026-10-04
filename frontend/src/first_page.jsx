
import React from 'react';
import './first_page.css';
import NavbarLanding from './navbar_landing.jsx'
import Why_choose_us from './Why_choose_us.jsx'
import ExploreServices from './Services.jsx'
import HowItWorks from './HowItWorks.jsx'
export default function FirstPage() {
    return (
        <>
            
            <NavbarLanding/>
            <section className="hero-section">
                <div className="hero-text-content">
                    <h2 className="hero-heading">
                        Expert Help at Your
                        <span className="heading-highlight"> Doorstep.</span>
                    </h2>
                    <p className="hero-paragraph">
                        Connect with highly-rated, verified local professionals for all your 
                        home service needs. Quick booking, transparent pricing, and 
                        quality guaranteed.
                    </p>
                </div>
                <div className="hero-image-container">
                    <img 
                        src="/img1.png" 
                        alt="Service Provider Image" 
                        className="service-provider-image"
                    />
                </div>
            </section>
            <Why_choose_us/>
            <ExploreServices/>
            <HowItWorks/>
        </>
    );
}