import React from 'react';
import { Link } from 'react-router';
import './CallToActionLink.css';

interface CallToActionLinkProps {
  to: string;
  children: React.ReactNode;
}

const CallToActionLink = ({ to, children }: CallToActionLinkProps) => {
  return (
    <Link className="cta-link" to={to}>
      {children}
    </Link>
  );
};

export default CallToActionLink;
