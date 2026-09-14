import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetchWithRetry, type FetchWithRetryOptions } from './fetch-utils';

describe("fetch-utils", () => {

  const mockFetch = vi.fn();

  describe("fetchWithRetry", () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should return the response if the first fetch attempt is successful", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const options: FetchWithRetryOptions = {
        url: "https://example.com",
        retries: 2,
      };

      const response = await fetchWithRetry(options);
      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should retry the fetch request on Error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"))
               .mockRejectedValueOnce(new Error("Network error"))
               .mockResolvedValueOnce(new Response(null, { status: 200 }));

      const options: FetchWithRetryOptions = {
        url: "https://example.com",
        retries: 2,
      };

      const response = await fetchWithRetry(options);
      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should retry the fetch request on a non-OK response", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }))
               .mockResolvedValueOnce(new Response(null, { status: 500 }))
               .mockResolvedValueOnce(new Response(null, { status: 200 }));

      const options: FetchWithRetryOptions = {
        url: "https://example.com",
        retries: 2,
      };

      const response = await fetchWithRetry(options);
      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should call onError callback on fetch Error", async () => {
      const onError = vi.fn();
      mockFetch.mockRejectedValueOnce(new Error("Network error"))
               .mockRejectedValueOnce(new Error("Network error"))
               .mockResolvedValueOnce(new Response(null, { status: 200 }));

      const options: FetchWithRetryOptions = {
        url: "https://example.com",
        retries: 2,
        onError,
      };

      const response = await fetchWithRetry(options);
      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(onError).toHaveBeenCalledTimes(2);
    });

    it("should throw if all fetch attempts throw", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const options: FetchWithRetryOptions = {
        url: "https://example.com",
        retries: 2,
      };

      await expect(fetchWithRetry(options)).rejects.toThrow("Network error");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should call onErrorResponse callback on a non-OK response", async () => {
      const onErrorResponse = vi.fn();
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }))
               .mockResolvedValueOnce(new Response(null, { status: 500 }))
               .mockResolvedValueOnce(new Response(null, { status: 200 }));

      const options: FetchWithRetryOptions = {
        url: "https://example.com",
        retries: 2,
        onErrorResponse,
      };

      const response = await fetchWithRetry(options);
      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(onErrorResponse).toHaveBeenCalledTimes(2);
    });

    it("should return the last response if all retries fail", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }))
               .mockResolvedValueOnce(new Response(null, { status: 500 }))
               .mockResolvedValueOnce(new Response(null, { status: 500 }));

      const options: FetchWithRetryOptions = {
        url: "https://example.com",
        retries: 2,
      };

      const response = await fetchWithRetry(options);
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should call onRetry callback before each retry attempt", async () => {
      const onRetry = vi.fn();
      mockFetch.mockRejectedValueOnce(new Error("Network error"))
               .mockRejectedValueOnce(new Error("Network error"))
               .mockResolvedValueOnce(new Response(null, { status: 200 }));

      const options: FetchWithRetryOptions = {
        url: "https://example.com",
        retries: 2,
        onRetry,
      };

      const response = await fetchWithRetry(options);
      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it("should trigger a retry if onRetry throws", async () => {
      const onRetry = vi.fn().mockRejectedValueOnce(new Error("onRetry error"));
      mockFetch.mockRejectedValueOnce(new Error("Network error"))
               .mockResolvedValueOnce(new Response(null, { status: 200 }));

      const options: FetchWithRetryOptions = {
        url: "https://example.com",
        retries: 2,
        onRetry,
      };

      const response = await fetchWithRetry(options);
      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledTimes(2);
    });
  });
});
