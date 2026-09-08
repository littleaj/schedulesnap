import React from 'react';
import { Link } from 'react-router';
import './AppLogoLink.css';

interface AppLogoLinkProps {
  to: string;
}

const scheduleSnapLogo = '/assets/schedule-snap-logo.svg';

const AppLogo = () => {
  return <img className="app-logo-link__image" src={scheduleSnapLogo} alt="ScheduleSnap" />;
};

const AppLogoLink = ({ to }: AppLogoLinkProps) => {
  return (
    <Link className="app-logo-link" to={to} aria-label="ScheduleSnap">
      <AppLogo />
    </Link>
  );
};

export default AppLogoLink;
