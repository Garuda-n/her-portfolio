import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-branding">
          <h2 className="footer-logo">FORHER<span className="logo-accent">.</span></h2>
          <p className="footer-tagline">Cinematic Post-Production & Film Editing Portfolio.</p>
        </div>
        
        <div className="footer-links-group">
          <div className="footer-column">
            <h4>Sections</h4>
            <a href="#featured">Featured Work</a>
            <a href="#work">All Work</a>
            <a href="#about">About Me</a>
            <a href="#contact">Get In Touch</a>
            <a href="#/admin">Admin Portal</a>
          </div>
          
          <div className="footer-column">
            <h4>Socials</h4>
            <a href="https://vimeo.com" target="_blank" rel="noopener noreferrer">Vimeo</a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">YouTube</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} FORHER. All rights reserved.</p>
      </div>
    </footer>
  );
};
