import React from 'react';
import './Card.css';

interface CardProps<T extends HTMLElement = HTMLElement> extends React.HTMLAttributes<T> {
  children: React.ReactNode;
  element?: React.ReactElement<React.HTMLAttributes<T>>;
}

export const Card = <T extends HTMLElement>({ element = <div />, children, className='', ...rest }: CardProps<T>) => {
  return React.cloneElement(element, { className: `card ${className}`, ...rest }, children);
};

