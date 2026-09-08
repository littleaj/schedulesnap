import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { User } from 'firebase/auth';
import UserIcon from '@/components/atoms/UserIcon';
import './UserMenu.css';

interface UserMenuProps {
  user: User | null;
}

const UserMenu = ({ user }: UserMenuProps) => {
  const isLoggedIn = Boolean(user);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleDocumentPointerDown = (event: PointerEvent) => {
      const menuElement = menuRef.current;
      if (menuElement && !menuElement.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu__trigger"
        type="button"
        aria-label="Open account menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(current => !current)}
      >
        <UserIcon
          loggedIn={isLoggedIn}
          displayName={user?.displayName}
          photoURL={user?.photoURL}
        />
      </button>

      {isOpen ? (
        <div className="user-menu__panel" role="menu" aria-label="Account options">
          {isLoggedIn ? (
            <Link className="user-menu__item" to="/settings" role="menuitem" onClick={closeMenu}>
              SETTINGS
            </Link>
          ) : (
            <button
              className="user-menu__item user-menu__item--disabled"
              type="button"
              disabled
              onClick={closeMenu}
            >
              SETTINGS
            </button>
          )}

          <Link className="user-menu__item" to={isLoggedIn ? '/logout' : '/login'} role="menuitem" onClick={closeMenu}>
            {isLoggedIn ? 'LOGOUT' : 'LOGIN'}
          </Link>
        </div>
      ) : null}
    </div>
  );
};

export default UserMenu;
