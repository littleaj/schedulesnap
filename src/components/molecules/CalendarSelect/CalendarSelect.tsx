import React, { useCallback, useContext, useEffect, useState } from "react";
import LabeledSelect, { type SelectOption } from "@/components/atoms/LabeledSelect";
import { GoogleOAuthTokenContext } from "@/contexts/google-oauth";
import { useGoogleLogin } from "@/hooks/google-login";
import RefreshIcon from "@/icons/RefreshIcon";
import "./CalendarSelect.css";

interface CalendarSelectProps {
  id: string;
  defaultValue: string;
  onChange: (value: string) => void;
  error?: string;
}

const CalendarSelect = ({ id, defaultValue, onChange, error }: CalendarSelectProps) => {

  const [calendarOptions, setCalendarOptions] = useState<SelectOption[]>([]);
  const { getToken } = useContext(GoogleOAuthTokenContext);
  const [isLoading, setIsLoading] = useState(false);
  const { authenticate } = useGoogleLogin();

  const fetchCalendarOptions = useCallback(async () => {

    console.log('fetching calendarList...');
    const doFetch = async (token: string) => fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    try {
      let token = getToken();
      if (!token) {
        await authenticate();
        token = getToken();
      }

      if (!token) {
        throw new Error('Missing OAuth token after reauthentication.');
      }

      let response = await doFetch(token);

      if (!response.ok) {
        if (response.status === 401) {
          await authenticate();
          token = getToken();

          if (!token) {
            throw new Error('Missing OAuth token after reauthentication.');
          }

          response = await doFetch(token);
          if (!response.ok) {
            throw new Error(`Failed to fetch calendar list after reauthentication: ${response.status} ${response.statusText}`);
          }
        } else {
          throw new Error(`Failed to fetch calendar list: ${response.status} ${response.statusText}`);
        }
      }

      // TODO: cache this response in local storage.
      const data = await response.json();

      return data.items.map((calendar: any) => ({ value: calendar.id, label: calendar.summary })) as SelectOption[];
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      return [];
    }
  }, [authenticate, getToken]);

  const loadCalendarOptions = useCallback(() => {
    setIsLoading(true);

    const doLoadOptions = async () => {
      try {
        const options = await fetchCalendarOptions();
        console.log(`Loaded ${options.length} calendar options. refreshing list...`);
        setCalendarOptions(options);
      } catch (error) {
        console.error('Error fetching calendar list:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void doLoadOptions();
  }, [fetchCalendarOptions]);

  useEffect(() => {
    if (isLoading) return;
    if (calendarOptions.length > 0) return;
    loadCalendarOptions();
  }, [loadCalendarOptions]);

  return (
    <div className="calendar-select">
      <LabeledSelect
        id={id}
        label="Default calendar"
        value={defaultValue}
        options={calendarOptions}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        disabled={isLoading || calendarOptions.length === 0}
      />
      <button onClick={loadCalendarOptions} disabled={isLoading}>
        <RefreshIcon />
      </button>
    </div>
  );
};

export default CalendarSelect;
