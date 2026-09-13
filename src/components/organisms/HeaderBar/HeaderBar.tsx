import React from 'react';
import AppLogoLink from '@/components/atoms/AppLogoLink';
import IconLink from '@/components/atoms/IconLink';
import NavButtonLink from '@/components/atoms/CallToActionLink';
import UserMenu from '@/components/molecules/UserMenu';
import './HeaderBar.css';
import useCurrentUser from '@/hooks/current-user';
const HelpIcon = '/assets/help-icon.svg';

const HeaderBar = () => {
  const user = useCurrentUser();

  console.log("[HeaderBar] currentUser: ", !!user)

  return (
    <header className="header-bar">
      <nav className="header-bar__nav" aria-label="Primary">
        <div className="header-bar__left">
          <AppLogoLink to="/" />
        </div>

        <div className="header-bar__center">
          <NavButtonLink to="/capture">SNAP SCHEDULE</NavButtonLink>
        </div>

        <div className="header-bar__right">
          <IconLink to="/help" label="Help" iconSrc={HelpIcon} />
          <UserMenu user={user} />
        </div>
      </nav>
    </header>
  );
};

export default HeaderBar;
