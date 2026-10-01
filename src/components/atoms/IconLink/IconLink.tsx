import React from 'react';
import { Link } from 'react-router';
import './IconLink.css';

interface IconLinkProps {
  to: string;
  label: string;
  iconSrc: string;
  iconAlt?: string;
  className?: string;
}

// TODO: update to allow embedded SVGs so I can control their color via CSS
const IconLink = ({ to, label, iconSrc, iconAlt = '', className = '' }: IconLinkProps) => {
  return (
    <Link className={`icon-link ${className}`.trim()} to={to} aria-label={label}>
      <img className="icon-link__image" src={iconSrc} alt={iconAlt} />
    </Link>
  );
};

export default IconLink;
