import type { QueuedEventItem } from "./types";

export const summarizeQueue = (items: QueuedEventItem[]) => {
  const doneCount = items.filter(item => item.status !== 'pending').length;
  return {
    progressPercent: items.length ? Math.round((doneCount / items.length) * 100) : 100,
    hasFailures: items.some(item => item.status === 'failed'),
    isFinished: items.every(item => item.status === 'success'),
  }
};

