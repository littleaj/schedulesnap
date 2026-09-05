import React from 'react';
import Card from '../../atoms/Card';
import './FeatureCard.css';

interface FeatureCardProps {
  icon: React.ReactNode;
  heading: React.ReactNode;
  children: React.ReactNode;
}

const FeatureCard = ({ icon, heading, children }: FeatureCardProps) => {
  return (
    <Card>
      <div className="feature-card">
        <span className="feature-card__icon" aria-hidden="true">
          {icon}
        </span>
        <h2>{heading}</h2>
        <div className="feature-card__body">{children}</div>
      </div>
    </Card>
  );
};

export default FeatureCard;
