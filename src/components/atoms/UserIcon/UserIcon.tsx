import React, { useState } from 'react';
import './UserIcon.css';

interface UserIconProps {
  displayName?: string | null;
  photoURL?: string | null;
  loggedIn: boolean;
}

const emptyUserIconSrc = '/assets/user-icon-empty.svg';
const filledUserIconSrc = '/assets/user-icon-filled.svg';

const UserIcon = ({ displayName, photoURL, loggedIn }: UserIconProps) => {
  const [hasImageError, setHasImageError] = useState(false);

  if (loggedIn && photoURL && !hasImageError) {
    return (
      <img
        className="user-icon__image"
        src={photoURL}
        alt={`${displayName ?? 'User'} avatar`}
        onError={() => {
          console.error('UserIcon avatar failed to load', { displayName, photoURL });
          setHasImageError(true);
        }}
      />
    );
  }

  return (
    <img
      className="user-icon__image"
      src={loggedIn ? filledUserIconSrc : emptyUserIconSrc}
      alt=""
      aria-hidden="true"
    />
  );
};

export default UserIcon;
