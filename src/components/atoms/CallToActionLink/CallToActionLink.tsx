import React from 'react';
import { Link } from 'react-router';
import './NavButtonLink.css';

interface CallToActionLinkProps {
  to: string;
  children: React.ReactNode;
}

const CallToActionLink = ({ to, children }: CallToActionLinkProps) => {
  return (
    <Link className="link-button" to={to}>
      {children}
    </Link>
  );
};

export default CallToActionLink;
