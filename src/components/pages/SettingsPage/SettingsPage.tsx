import React from 'react';
import ProfileForm from '@/components/organisms/ProfileForm';
import './SettingsPage.css';
import PageContent from '@/components/templates/PageContent';

const SettingsPage = () => {
  return (
    <PageContent className="settings-page">
      <ProfileForm
        heading="Profile settings"
        subheading="Update your schedule profile at any time."
        submitLabel="Save settings"
      />
    </PageContent>
  );
};

export default SettingsPage;
