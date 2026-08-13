import React, { useState, useEffect } from 'react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        <a href="#" className="navbar-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          FORHER<span className="logo-accent">.</span>
        </a>

        <div className={`navbar-links ${isMobileMenuOpen ? 'navbar-links-active' : ''}`}>
          <a href="#featured" onClick={(e) => { e.preventDefault(); scrollToSection('featured'); }}>Featured</a>
          <a href="#work" onClick={(e) => { e.preventDefault(); scrollToSection('work'); }}>Portfolio</a>
          <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a>
        </div>

        <button 
          className="navbar-toggle" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`bar ${isMobileMenuOpen ? 'bar-1-active' : ''}`}></span>
          <span className={`bar ${isMobileMenuOpen ? 'bar-2-active' : ''}`}></span>
          <span className={`bar ${isMobileMenuOpen ? 'bar-3-active' : ''}`}></span>
        </button>
      </div>
    </nav>
  );
};
