// HowItWorks.jsx
import React from 'react';
// Importing the external CSS file to apply our styles
import './HowItWorks.css';

// The main functional component for the "How it Works" section
const HowItWorks = () => {
  return (
    // The outermost wrapper, establishing the background color and padding for the section
    <section className="how-it-works-wrapper" id = "how-it-works">
      
      {/* The grid container that handles the staggered 3-column masonry-style layout */}
      <div className="steps-grid">
        {/* --- CARD 1: Search for services (Spans 2 columns) --- */}
        <div className="step-card card-search">
          {/* A container specifically for the text content, separating it from the background graphic */}
          <div className="card-content">
            {/* The light blue icon box with a magnifying glass SVG */}
            <div className="icon-box blue-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            {/* The primary title for the step */}
            <h3 className="step-title">1. Search for services</h3>
            {/* The descriptive paragraph */}
            <p className="step-description">
              Browse hundreds of services from plumbing and electrical to housekeeping and carpentry. Use our smart filters to find pros in your local area.
            </p>
          </div>
        </div>

        {/* --- CARD 2: Compare pros (Spans 1 column) --- */}
        <div className="step-card card-compare">
          {/* The light blue icon box with a comparison arrows SVG */}
          <div className="icon-box blue-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
          </div>
          <h3 className="step-title">2. Compare pros</h3>
          <p className="step-description">
            Review detailed profiles, portfolio photos, verified ratings, and transparent pricing models.
          </p>
          {/* A flex container to horizontally align the stars and the rating text */}
          <div className="rating-wrapper">
            <div className="stars">
              {/* Rendering 5 identical star SVGs to match the design */}
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#5C4033" stroke="#5C4033" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              ))}
            </div>
            {/* The numerical rating score */}
            <span className="rating-score">4.9/5</span>
          </div>
        </div>

        {/* --- CARD 3: Book & pay securely (Spans 1 column) --- */}
        <div className="step-card card-book">
          {/* Note: This icon box uses a green variation (green-icon) as per the image */}
          <div className="icon-box green-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline>
            </svg>
          </div>
          <h3 className="step-title">3. Book & pay securely</h3>
          <p className="step-description">
            Select a time slot and pay securely through our  system. Your funds are held until you confirm the job is done.
          </p>
        </div>

        {/* --- CARD 4: Review your pro (Spans 2 columns) --- */}
        <div className="step-card card-review">
          {/* A wrapper for the text content to keep it separated from the image on the right */}
          <div className="review-text-content">
            <div className="icon-box blue-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><polyline points="9 10 12 13 15 10"></polyline>
              </svg>
            </div>
            <h3 className="step-title">4. Review your pro</h3>
            <p className="step-description">
              Help the community by sharing your experience. Honest feedback ensures only the best professionals thrive on ProFix.
            </p>
          </div>
          <div className="review-image-wrapper">
            <img src="img15.png" alt="Woman writing review" className="review-image" />
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;