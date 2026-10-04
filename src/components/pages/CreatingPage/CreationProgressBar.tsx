import React from "react";

export interface CreationProgressBarProps {
  /**
   * A number from 1 to 100.
   */
  percent: number;
  isFinished: boolean;
}

const CreationProgressBar = ({ percent, isFinished }: CreationProgressBarProps) => {
  return (
    <div className="creating-card__progress">
      {isFinished ? (
        <output className="creating-card__success">Creation complete.</output>
      ) : (
        <>
          <progress max={100} value={percent} aria-label="Creation progress" />
          <span>{percent}%</span>
        </>
      )}
    </div>
  );
};

export default CreationProgressBar;
