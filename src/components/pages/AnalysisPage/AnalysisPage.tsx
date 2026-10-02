import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useFirestore } from '@/hooks/firebase';
import { getUserProfile } from '@/services/user-profile';
import {
  analyzeSchedulePhoto,
  loadCapturedSchedulePhoto,
} from '@/services/schedule-analysis';
import './AnalysisPage.css';
import useCurrentUser from '@/hooks/current-user';
import PageContent from '@/components/templates/PageContent';
import { Card } from '@/components/atoms/Card';
import ActionButton from '@/components/atoms/ActionButton';

const AnalysisPage = () => {
  const navigate = useNavigate();
  const firestore = useFirestore();
  const [statusMessage, setStatusMessage] = useState('Reading your schedule photo and extracting shifts...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const user = useCurrentUser();
  const location = useLocation();
  const [isReady, setIsReady] = useState(location.state?.analyze ?? false);

  if (!user) {
    console.error('User is not authenticated. Redirecting to login page.');
    return <Navigate to="/login" replace />;
  }

  const capturedPhoto = loadCapturedSchedulePhoto(user.uid);

  const doAnalysis = useCallback(() => {

    const runAnalysis = async () => {
      if (!capturedPhoto) {
        setErrorMessage('No captured photo was found. Go back and upload a schedule image first.');
        setStatusMessage('Waiting for a captured schedule photo.');
        return;
      }

      try {
        const profile = await getUserProfile(firestore, user.uid);
        const targetName = profile?.targetName ?? user?.displayName ?? '';

        if (targetName.trim() === '') {
          setErrorMessage('No target name found for analysis.');
          setStatusMessage('Analysis paused. Go to settings to set your target name.');
          return;
        }
        console.log("Target name for analysis:", targetName);

        console.info("Starting analysis....");
        setStatusMessage('Analyzing the image...');
        const response = await analyzeSchedulePhoto(user.uid, capturedPhoto, targetName);

        console.log("Analysis response:", response);

        void navigate('/confirm', { replace: true, viewTransition: true });
      } catch (e) {
        console.error("Error during analysis:", e);

        setErrorMessage('Something went wrong reading your photo. Refresh the page and try again.');
        setStatusMessage('Analysis failed.');
      }
    };

    void runAnalysis().finally(() => {
      console.info("Analysis finished.");
    });
  }, [user, firestore, navigate]);

  useEffect(() => {
    if (isReady) {
      doAnalysis();
    }
  }, [doAnalysis, isReady]);


  const AnalysisContent = (
    <>
      <h1 id="analysis-title">Analyzing your schedule</h1>

      <div className="analysis-card__status" role="status" aria-live="polite">
        {/* TODO: use LoadingSpinner component */}
        <div
          className={'analysis-card__icon ' + (errorMessage ? 'analysis-card__icon--error' : 'analysis-card__spinner')}
          aria-hidden="true"
        />
        <p>{statusMessage}</p>
      </div>
    </>
  );

  const ButtonContent = (
    <ActionButton
      variant="primary"
      onClick={() => setIsReady(true)}
      className="analysis-card__action"
    >
      Start Analysis
    </ActionButton>
  )

  return (
    <PageContent className="analysis-page">
      <Card className="analysis-card" aria-labelledby="analysis-title" aria-live="polite">
        <p className="eyebrow">AI Analysis</p>
        {isReady ? AnalysisContent : ButtonContent}
        <div className="analysis-card__details">
          {errorMessage ? (
            <p role="alert">{errorMessage}</p>
          ) : (
            <p>
              ScheduleSnap is checking the image and preparing the extracted shift list for your review.
            </p>
          )}
        </div>
      </Card>
    </PageContent>
  );
};

export default AnalysisPage;
