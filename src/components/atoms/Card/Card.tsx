import React from 'react';
import './Card.css';

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const Card = ({ children, className='', ...rest }: CardProps) => {
  return <article className={`card ${className}`} {...rest}>{children}</article>;
};

