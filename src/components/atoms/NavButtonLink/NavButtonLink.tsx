import React from 'react';
import { Link } from 'react-router';
import './NavButtonLink.css';

interface NavButtonLinkProps {
  to: string;
  children: React.ReactNode;
}

const NavButtonLink = ({ to, children }: NavButtonLinkProps) => {
  return (
    <Link className="nav-button-link" to={to}>
      {children}
    </Link>
  );
};

export default NavButtonLink;
