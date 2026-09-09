import React, { useRef, useState } from 'react';
import ActionButton from '@/components/atoms/ActionButton';
import './CapturePage.css';
import { useNavigate } from 'react-router';

const CapturePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  return (
    <main className="capture-page">
      <section className="capture-card" aria-labelledby="capture-title">
        <p className="capture-card__eyebrow">Scan a schedule</p>
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
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="capture-card__input"
          />

          <div className="capture-card__actions">
            <ActionButton
              variant="primary"
              onClick={() => navigate('/analyze')}
              disabled={!selectedFile}
            >
              Analyze
            </ActionButton>
          </div>
        </div>

        {selectedFile ? (
          <p className="capture-card__file" aria-live="polite">
            Selected file: <strong>{selectedFile.name}</strong>
          </p>
        ) : null}
      </section>
    </main>
  );
};

export default CapturePage;
