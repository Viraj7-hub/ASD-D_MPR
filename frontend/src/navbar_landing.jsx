
import React from 'react';
import './navbar_landing.css';
import {Link as ScrollLink} from 'react-scroll'
import { Link as RouterLink} from 'react-router-dom' ;
function NavbarLanding() {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <p>ProFix</p>
            </div>
            <div className="navbar-links">
                <p><ScrollLink to='how-it-works' smooth={true} offset={-57} duration={500}>How it Works</ScrollLink></p>
                <p><ScrollLink to='why_choose_us' smooth={true} offset={-57} duration={500}>Why choose us ?</ScrollLink></p>
                <p><ScrollLink to='services' smooth={true} offset={-57} duration={500}>Services</ScrollLink></p>
            </div>
            <div className="navbar-actions">
                <button type="button" className="btn-login"><RouterLink to = '/login'>Login</RouterLink></button>
                <button type="button" className="btn-signup"><RouterLink to = '/signup'>Sign Up</RouterLink></button>
            </div>
        </nav>
    );
}

export default NavbarLanding;