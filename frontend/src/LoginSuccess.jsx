

import React from 'react';
import './LoginSuccess.css';
function LoginSuccess() {
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
        <h2 className="modal-title">Log In Successful!</h2>
      </div>
    </div>
  );
}

export default LoginSuccess;