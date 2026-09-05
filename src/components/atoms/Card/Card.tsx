import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
}

const Card = ({ children }: CardProps) => {
  return <article className="card">{children}</article>;
};

export default Card;
