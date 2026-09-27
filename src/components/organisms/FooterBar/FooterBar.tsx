import React from "react";
import { Link } from "react-router";
import './FooterBar.css';

const FooterBar = () => {
  return (
    <footer className="footer-bar">
      <ul className="footer-bar__links">
        <li><Link to="/help">Help</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/privacy">Privacy</Link></li>
        <li><Link to="/terms">Terms</Link></li>
      </ul>
      <p className="footer-bar__copyright">© 2026 Arthur Little. All rights reserved.</p>
    </footer>
  );
};

export default FooterBar;
