import React from 'react';
import { Link } from 'react-router';
import './AppLogoLink.css';

interface AppLogoLinkProps {
  to: string;
}

const scheduleSnapLogo = '/assets/ScheduleSnap-Logo_380x380.png';

// TODO: embed svg and update color to primary
const AppLogo = () => {
  return <img className="app-logo-link__image" src={scheduleSnapLogo} alt="ScheduleSnap" />;
};

const AppLogoLink = ({ to }: AppLogoLinkProps) => {
  return (
    <Link className="app-logo-link" to={to} aria-label="ScheduleSnap" title="ScheduleSnap Home Page">
      <AppLogo />
    </Link>
  );
};

export default AppLogoLink;
