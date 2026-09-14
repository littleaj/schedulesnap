
export type FetchWithRetryCallbackResult = FetchWithRetryOptions | undefined | null | false;

export interface FetchWithRetryOptions {
  url: string;
  fetchOptions?: RequestInit;
  retries?: number;
  /**
   * Callback invoked when the fetch response is not OK. Can return updated fetch options, or false to stop retrying.
   * @param response The fetch response object that was not OK.
   * @returns Updated fetch options, undefined or null to use the existing options, or false to stop retrying.
   */
  onErrorResponse?: (response: Response) => Promise<FetchWithRetryCallbackResult>;
  /**
   * Callback invoked when the fetch request throws an error. Can return updated fetch options, or false to stop retrying.
   * @param error The error thrown by the fetch request.
   * @returns Updated fetch options, undefined or null to use the existing options, or false to stop retrying.
   */
  onError?: (error: any) => Promise<FetchWithRetryCallbackResult>;
  /**
   * Callback invoked before each retry attempt. Can be used for logging or other side effects.
   * @param attempt The current retry attempt number (starting from 1).
   */
  onRetry?: (attempt: number) => Promise<void>;
}

export const fetchWithRetry = async (options: FetchWithRetryOptions): Promise<Response> => {
  const { url, fetchOptions = {}, retries = 1, onErrorResponse, onError, onRetry } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (onRetry && attempt > 0) {
        await onRetry(attempt);
      }
      const response = await fetch(url, fetchOptions);
      if (!response.ok && attempt < retries) {
        if (onErrorResponse) {
          const updatedOptions = await onErrorResponse(response);

            if (updatedOptions === false) {
            break;
          }

          if (updatedOptions !== undefined && updatedOptions !== null) {
            Object.assign(options, updatedOptions);
          }
        }
        continue;
      }
      return response;
    } catch (error) {
      if (attempt < retries) {
        if (onError) {
          const updatedOptions = await onError(error);
          if (updatedOptions === false) {
            break;
          }
          if (updatedOptions !== undefined && updatedOptions !== null) {
            Object.assign(options, updatedOptions);
          }
        }
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to fetch after retries');
};
