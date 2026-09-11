import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CapturePage from './CapturePage';

const {
  resizeSchedulePhotoMock,
  saveCapturedSchedulePhotoMock,
  navigateMock,
} = vi.hoisted(() => ({
  resizeSchedulePhotoMock: vi.fn(),
  saveCapturedSchedulePhotoMock: vi.fn(),
  navigateMock: vi.fn(),
}));

const fakeUid = "fake-uid-capture-page";
vi.mock('@/hooks/firebase', () => ({
  useAuth: () => ({
    currentUser: { uid: fakeUid },
  }),
}));

vi.mock('react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/services/schedule-analysis', () => ({
  resizeSchedulePhoto: resizeSchedulePhotoMock,
  saveCapturedSchedulePhoto: saveCapturedSchedulePhotoMock,
}));

describe('CapturePage', () => {
  it('renders the upload instructions and file input', () => {
    render(<CapturePage />);

    expect(screen.getByRole('heading', { name: /upload your schedule photo/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/choose a schedule photo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze Photo/i })).toBeInTheDocument();
  });

  it('resizes and caches the selected file before enabling review', async () => {
    resizeSchedulePhotoMock.mockResolvedValue({
      base64: 'resized-base64',
      mimeType: 'image/jpeg',
      fileName: 'schedule.png',
    });

    render(<CapturePage />);

    const input = screen.getByLabelText(/choose a schedule photo/i) as HTMLInputElement;

    fireEvent.change(input, {
      target: {
        files: [new File(['test'], 'schedule.png', { type: 'image/png' })],
      },
    });

    await waitFor(() => {
      expect(resizeSchedulePhotoMock).toHaveBeenCalledTimes(1);
      expect(saveCapturedSchedulePhotoMock).toHaveBeenCalledWith(fakeUid, {
        base64: 'resized-base64',
        mimeType: 'image/jpeg',
        fileName: 'schedule.png',
      });
    });

    expect(screen.getByText(/schedule\.png/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze Photo/i })).toBeEnabled();
  });

  it('navigates to analysis after a photo is prepared', async () => {
    resizeSchedulePhotoMock.mockResolvedValue({
      base64: 'resized-base64',
      mimeType: 'image/jpeg',
      fileName: 'schedule.png',
    });

    render(<CapturePage />);

    fireEvent.change(screen.getByLabelText(/choose a schedule photo/i), {
      target: {
        files: [new File(['test'], 'schedule.png', { type: 'image/png' })],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Photo/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Photo/i }));

    expect(navigateMock).toHaveBeenCalledWith('/analyze');
  });
});
