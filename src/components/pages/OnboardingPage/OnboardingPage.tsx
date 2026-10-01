import React from 'react';
import { useNavigate } from 'react-router';
import ProfileForm from '@/components/organisms/ProfileForm';
import { useUserProfileForm } from '@/hooks/user-profile-form';
import './OnboardingPage.css';
import PageContent from '@/components/templates/PageContent';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const form = useUserProfileForm({
    successMessage: 'Profile saved. Redirecting to capture...'
  });

  const handleSubmit = async () => {
    const isSaved = await form.submit();
    console.log("Submitting settings:", isSaved);

    if (isSaved) {
      console.log("Continuing to /capture...")
      void navigate('/capture', { replace: true });
    }
  };

  return (
    <PageContent className="onboarding-page">
      <ProfileForm
        heading="Complete your profile"
        subheading="Set your name, timezone, and reminder preferences before importing shifts."
        submitLabel="Save and continue"
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
          void handleSubmit();
        }}
      />
    </PageContent>
  );
};

export default OnboardingPage;
