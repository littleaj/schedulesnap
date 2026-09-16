import React from 'react';
import { Card } from '@/components/atoms/Card';
import './FeatureCard.css';

interface FeatureCardHeaderProps {
  icon?: React.ReactNode;
  heading?: React.ReactNode;
}

interface FeatureCardProps extends FeatureCardHeaderProps, React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const FeatureCard = ({ icon, heading, children, className = '', ...props }: FeatureCardProps) => {
  return (
    <Card element={<article />} className={`feature-card ${className}`} {...props}>
      <FeatureCardHeader icon={icon} heading={heading} />
      <div className="feature-card__body">
        {children}
      </div>
    </Card>
  );
};

const FeatureCardHeader = ({ icon, heading }: { icon?: React.ReactNode; heading?: React.ReactNode }) => {
  if (!icon && !heading) {
    console.warn('FeatureCardHeader rendered without icon and heading. Just use a <Card> instead.');
    return null;
  }

  return (
    <hgroup className="feature-card__header">
      {!icon ? null : (
        <span className="feature-card__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {!heading ? null : (
        <h2>{heading}</h2>
      )}
    </hgroup>
  );
};

export default FeatureCard;
