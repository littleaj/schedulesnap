import React from 'react';
import { useNavigate } from 'react-router';
import ProfileForm from '@/components/organisms/ProfileForm';
import './OnboardingPage.css';
import PageContent from '@/components/templates/PageContent';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const handleSubmit = () => {
    void navigate('/capture', { replace: true });
  };

  return (
    <PageContent className="onboarding-page">
      <ProfileForm
        heading="Complete your profile"
        subheading="Set your name, timezone, and reminder preferences before importing shifts."
        submitLabel="Save and continue"
        onSubmit={handleSubmit}
      />
    </PageContent>
  );
};

export default OnboardingPage;
