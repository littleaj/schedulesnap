import React from 'react';
import ProfileForm from '@/components/organisms/ProfileForm';
import { useUserProfileForm } from '@/hooks/user-profile-form';
import './SettingsPage.css';

const SettingsPage = () => {
  const form = useUserProfileForm({
    successMessage: 'Profile saved',
  });

  return (
    <main className="settings-page">
      <ProfileForm
        heading="Profile settings"
        subheading="Update your schedule profile at any time."
        submitLabel="Save settings"
        values={form.values}
        errors={form.errors}
        isLoading={form.isLoading}
        isSubmitting={form.isSubmitting}
        errorMessage={form.errorMessage}
        successMessage={form.successMessage}
        onTargetNameChange={form.setTargetName}
        onTimezoneChange={form.setTimezone}
        onDefaultCalendarIdChange={form.setDefaultCalendarId}
        onReminderEnabledChange={form.setReminderEnabled}
        onReminderMinutesChange={form.setReminderMinutesBefore}
        onSubmit={() => {
          void form.submit();
        }}
      />
    </main>
  );
};

export default SettingsPage;
