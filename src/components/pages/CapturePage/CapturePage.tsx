import React, { useState } from 'react';
import ActionButton from '@/components/atoms/ActionButton';
import './CapturePage.css';
import { useNavigate } from 'react-router';
import { resizeSchedulePhoto, saveCapturedSchedulePhoto } from '@/services/schedule-analysis';
import useCurrentUser from '@/hooks/current-user';
import { useUserOnboardingStatus } from '@/hooks/user-onboarding';

const CapturePage = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { isChecking, hasCompletedOnboarding } = useUserOnboardingStatus();
  const user = useCurrentUser();

  if (isChecking || !hasCompletedOnboarding) {
    return null;
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setErrorMessage(null);
    setIsReady(false);
    setSelectedFile(file);

    if (!file) {
      return;
    }

    setIsProcessing(true);

    try {
      const resizedPhoto = await resizeSchedulePhoto(file);

      if (!user) {
        throw new Error("User is not authenticated.");
      }

      saveCapturedSchedulePhoto(user.uid, resizedPhoto);
      setIsReady(true);
    } catch {
      setErrorMessage('We could not prepare that photo. Try a different image or recapture it.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="capture-page">
      <section className="capture-card" aria-labelledby="capture-title">
        <p className="capture-card__eyebrow">Capture your schedule</p>
        <h1 id="capture-title">Upload your schedule photo</h1>
        <p className="capture-card__intro">
          Take a photo or upload a saved image to extract your shifts and review them before saving to Google Calendar.
        </p>

        <div className="capture-card__uploader">
          <label htmlFor="schedule-photo" className="capture-card__label">
            Choose a schedule photo
          </label>
          <input
            id="schedule-photo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="capture-card__input"
          />

          <div className="capture-card__actions">
            <ActionButton
              variant="primary"
              onClick={() => navigate('/analyze')}
              disabled={!selectedFile || isProcessing || !isReady}
            >
              {isProcessing ? 'Preparing photo...' : 'Analyze Photo'}
            </ActionButton>
          </div>
        </div>

        {selectedFile ? (
          <p className="capture-card__file" aria-live="polite">
            Selected file: <strong>{selectedFile.name}</strong>
          </p>
        ) : null}

        {errorMessage ? (
          <p className="capture-card__file" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
};

export default CapturePage;
