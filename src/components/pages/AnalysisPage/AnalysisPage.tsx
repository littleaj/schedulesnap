import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import ActionButton from '@/components/atoms/ActionButton';
import { useFirestore } from '../../../hooks/firebase';
import { getUserProfile } from '../../../services/user-profile';
import {
  analyzeSchedulePhoto,
  loadCapturedSchedulePhoto,
} from '../../../services/schedule-analysis';
import './AnalysisPage.css';
import useCurrentUser from '@/hooks/current-user';

const AnalysisPage = () => {
  const navigate = useNavigate();
  const firestore = useFirestore();
  const [statusMessage, setStatusMessage] = useState('Reading your schedule photo and extracting shifts...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const user = useCurrentUser();
  const location = useLocation();

  useEffect(() => {
    let isActive = true;

    if (!user) {
      setErrorMessage('Your sign-in expired before analysis could start. Please sign in again.');
      setStatusMessage('Analysis paused.');
      throw new Error("User is not authenticated.");
    }

    const { uid } = user;

    const runAnalysis = async () => {
      const capturedPhoto = loadCapturedSchedulePhoto(uid);
      if (!capturedPhoto) {
        if (!isActive) {
          return;
        }

        setErrorMessage('No captured photo was found. Go back and upload a schedule image first.');
        setStatusMessage('Waiting for a captured schedule photo.');
        return;
      }

      try {
        const profile = await getUserProfile(firestore, uid);
        const targetName = profile?.targetName ?? user?.displayName ?? '';

        if (targetName.trim() === '') {
          setErrorMessage('No target name found for analysis.');
          setStatusMessage('Analysis paused. Go to settings to set your target name.');
          return;
        }

        if (!isActive) {
          return;
        }

        setStatusMessage('Analyzing your schedule photo...');
        await analyzeSchedulePhoto(uid, capturedPhoto, targetName);

        if (!isActive) {
          return;
        }

        navigate('/confirm', { replace: true });
      } catch {
        if (!isActive) {
          return;
        }

        setErrorMessage('Something went wrong reading your photo. Check your connection and try again.');
        setStatusMessage('Analysis failed.');
      }
    };

    if (location.state?.from?.pathname !== '/capture') {
      console.warn('Analysis page accessed without coming from capture page, redirecting to capture page.');
      navigate('/capture', { replace: true });
      return;
    }

    void runAnalysis();

    return () => {
      isActive = false;
    };
  }, [user, firestore, navigate]);

  return (
    <main className="analysis-page">
      <section className="analysis-card" aria-labelledby="analysis-title" aria-live="polite">
        <p className="analysis-card__eyebrow">AI Analysis</p>
        <h1 id="analysis-title">Analyzing your schedule</h1>

        <div className="analysis-card__status" role="status" aria-live="polite">
          <div
            className={errorMessage ? 'analysis-card__icon analysis-card__icon--error' : 'analysis-card__spinner'}
            aria-hidden="true"
          />
          <p>{statusMessage}</p>
        </div>

        <div className="analysis-card__details">
          {errorMessage ? (
            <p role="alert">{errorMessage}</p>
          ) : (
            <p>
              ScheduleSnap is checking the image and preparing the extracted shift list for your review.
            </p>
          )}
        </div>
      </section>
    </main>
  );
};

export default AnalysisPage;
