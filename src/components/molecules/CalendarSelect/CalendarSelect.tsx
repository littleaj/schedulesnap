import React, { useCallback, useContext, useEffect, useState } from "react";
import LabeledSelect, { type SelectOption } from "@/components/atoms/LabeledSelect";
import { GoogleOAuthTokenContext } from "@/contexts/google-oauth";
import { useGoogleLogin } from "@/hooks/google-login";
import { sleep } from "@/utils/misc";
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

  const getCalendarOptions = useCallback(async (token: string) => {
    console.log('fetching calendarList...');
    const doFetch = async () => fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    try {
      // TODO: create a retry mechanism
      let response = await doFetch();

      if (!response.ok) {
        if (response.status === 401) {
          await authenticate();
          await sleep(500);
          response = await doFetch();
          if (!response.ok) {
            throw new Error(`Failed to fetch calendar list after reauthentication: ${response.status} ${response.statusText}`);
          }
        } else {
          throw new Error(`Failed to fetch calendar list: ${response.status} ${response.statusText}`);
        }
      }

      // TODO: cache this response in local storage.
      // TODO: add a refresh button next to the calendar select input.
      const data = await response.json();

      return data.items.map((calendar: any) => ({ value: calendar.id, label: calendar.summary })) as SelectOption[];
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      return [];
    }
  }, [authenticate]);

  const loadCalendarOptions = useCallback(() => {
    setIsLoading(true);
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      // TODO: reauthenticate the user if no token is available.
      return;
    }

    const doLoadOptions = async () => {
      try {
        const options = await getCalendarOptions(token);
        console.log(`Loaded ${options.length} calendar options. refreshing list...`);
        setCalendarOptions(options);
      } catch (error) {
        console.error('Error fetching calendar list:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void doLoadOptions();
  }, [getToken]);

  useEffect(() => {
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
