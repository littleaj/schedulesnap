import React, { useEffect, useRef, useState } from "react";

interface PhotoPanelProps {
  src: string;
}

const PhotoPanel = ({ src }: PhotoPanelProps) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<{ active: boolean; startX: number; startY: number; originX: number; originY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const handlePhotoZoom = (delta: number) => {
    setZoomLevel((currentZoom) => {
      const nextZoom = Math.max(1, Number((currentZoom + delta).toFixed(2)));
      return nextZoom;
    });
  };

  const handlePhotoWheel = (event: WheelEvent) => {
    event.preventDefault();
    handlePhotoZoom(event.deltaY < 0 ? 0.1 : -0.1);
  };

  const handlePhotoPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: panOffset.x,
      originY: panOffset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePhotoPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;
    setPanOffset({
      x: dragStateRef.current.originX + deltaX,
      y: dragStateRef.current.originY + deltaY,
    });
  };

  const handlePhotoPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  useEffect(() => {
    const el = document.getElementById('confirm-card-photo-viewport');
    if (!el) {
      return;
    }
    el.addEventListener('wheel', handlePhotoWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handlePhotoWheel);
    };
  }, []);

  return (
    <div className="confirm-card__photo-panel" aria-label="Captured schedule photo preview">
      <div
        id="confirm-card-photo-viewport"
        className="confirm-card__photo-viewport"
        onPointerDown={handlePhotoPointerDown}
        onPointerMove={handlePhotoPointerMove}
        onPointerUp={handlePhotoPointerUp}
        onPointerLeave={handlePhotoPointerUp}
      >
        <img
          className="confirm-card__photo"
          src={src}
          alt="Captured schedule"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          }}
        />
      </div>
    </div>
  );
};

export default PhotoPanel;
