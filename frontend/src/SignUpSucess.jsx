
import React from 'react';
import './SignUpSuccess.css';
function SuccessModal() {
  return (
    <div className="modal-overlay" >
      <div className="modal-content" >
        <div className="icon-container">
          <svg 
            className="success-icon" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h2 className="modal-title">Signed Up Successful!</h2>
        <p className="modal-message">
          Welcome aboard! Your account has been successfully created. 
        </p>
      </div>
    </div>
  );
}

export default SuccessModal;