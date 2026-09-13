import React from 'react';
import { ArticleCard } from '@/components/atoms/Card';
import './FeatureCard.css';

interface FeatureCardProps extends React.HTMLAttributes<HTMLElement> {
  icon?: React.ReactNode;
  heading?: React.ReactNode;
  children: React.ReactNode;
}

const FeatureCard = ({ icon, heading, children, className='', ...props }: FeatureCardProps) => {
  return (
    <ArticleCard className={className} {...props}>
      <div className="feature-card">
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
        <div className="feature-card__body">{children}</div>
      </div>
    </ArticleCard>
  );
};

export default FeatureCard;
