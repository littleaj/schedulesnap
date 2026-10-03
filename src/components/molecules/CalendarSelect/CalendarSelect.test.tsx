import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CalendarSelect from './CalendarSelect';
import { GoogleOAuthTokenContext } from '@/contexts/google-oauth';

const { authenticateMock } = vi.hoisted(() => ({
	authenticateMock: vi.fn(),
}));

vi.mock('@/hooks/google-login', () => ({
	useGoogleLogin: () => ({
		authenticate: authenticateMock,
	}),
}));

describe('CalendarSelect', () => {
	beforeEach(() => {
		authenticateMock.mockReset();
		vi.restoreAllMocks();
	});

	it('retries with a refreshed token after a 401 response', async () => {
		let currentToken = 'expired-token';

		authenticateMock.mockImplementation(async () => {
			currentToken = 'fresh-token';
			return {};
		});

		const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
			const authHeader = String(init?.headers ? (init.headers as Record<string, string>).Authorization : '');

			if (authHeader === 'Bearer fresh-token') {
				return {
					ok: true,
					status: 200,
					statusText: 'OK',
					json: async () => ({
						items: [{ id: 'primary', summary: 'Primary' }],
					}),
				};
			}

			return {
				ok: false,
				status: 401,
				statusText: 'Unauthorized',
			};
		});

		vi.stubGlobal('fetch', fetchMock);

		render(
			<GoogleOAuthTokenContext.Provider
				value={{
					getToken: () => currentToken,
					getTokenExpiresAt: () => null,
					setToken: () => undefined,
					setTokenExpiresAt: () => undefined,
				}}
			>
				<CalendarSelect id="default-calendar" defaultValue="" onChange={() => undefined} />
			</GoogleOAuthTokenContext.Provider>
		);

		await waitFor(() => {
			expect(authenticateMock).toHaveBeenCalledTimes(1);
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
			headers: {
				Authorization: 'Bearer expired-token',
			},
		});

		expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
			headers: {
				Authorization: 'Bearer fresh-token',
			},
		});

		await waitFor(() => {
			expect(screen.getByRole('option', { name: 'Primary' })).toBeInTheDocument();
		});
	});
});
