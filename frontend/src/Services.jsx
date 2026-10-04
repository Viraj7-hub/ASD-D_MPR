
import React from 'react';
import './Services.css';

const services = [
  {
    id: 'plumbing',
    title: 'Plumbing',
    description: 'Leaks, pipes, fixtures & emergency repairs.',

    image: 'img13.png', 
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>
      </svg>
    )
  },
  {
    id: 'housekeeping',
    title: 'Housekeeping',
    description: 'Deep cleaning, regular maintenance & move-out.',
    image: 'img12.png',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21 21-4.3-4.3"></path><path d="M13 3.2C9.8 4.6 7 7.1 5.3 10.3c-1.7 3.2-2 6.9-1 10.2"></path><path d="M21.9 14.8c-.8 3.5-3.1 6.5-6.3 8.1"></path><path d="M13 3.2c3.5-.8 7.1.1 10.1 2.3"></path><path d="M17.3 10.7a4.1 4.1 0 1 1-5.8-5.8"></path>
      </svg>
    )
  },
  {
    id: 'carpentry',
    title: 'Carpentry',
    description: 'Custom furniture, repairs, framing & decking.',
    image: 'img14.png',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m14.7 13.5-3.4-3.4"></path><path d="M20 16.5 16.5 20"></path><path d="m6.3 10.2 3.5 3.5"></path><path d="m3.5 13.5 7 7"></path><path d="M10.2 6.3l3.5 3.5"></path><path d="m13.5 3.5 7 7"></path>
      </svg>
    )
  },
  {
    id: 'electrical',
    title: 'Electrical',
    description: 'Wiring, lighting, panel upgrades & safety checks.',
    image: 'img11.png',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-5"></path><path d="M9 8V2"></path><path d="M15 8V2"></path><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"></path>
      </svg>
    )
  }
];


const ExploreServices = () => {
  return (
    <div className="services-wrapper" >
      <section className="services-container" id = 'services'>
        <div className="services-header">
          <div className="header-text-group">
            <h1 className="services-title">Explore Services</h1>
            <p className="services-subtitle">Find the right expert for your specific project.</p>
          </div>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <div key={service.id} className="service-card">
              <div className="card-image-container">
                <img src={service.image} alt={service.title} className="card-image" />
              </div>
              <div className="card-content">
                <div className="card-icon-wrapper">
                  {service.icon}
                </div>
                <h2 className="card-title">{service.title}</h2>
                <p className="card-description">{service.description}</p>
              </div>
            </div>
          ))}
          
        </div>
      </section>
    </div>
  );
};

export default ExploreServices;