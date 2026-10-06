import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('index.html metadata', () => {
  it('includes the expected SEO title, description, and mobile viewport settings', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const html = readFileSync(htmlPath, 'utf8');

    expect(html).toContain('<title>ScheduleSnap — Turn a schedule photo into calendar events</title>');
    expect(html).toContain('name="description"');
    expect(html).toContain(
      'ScheduleSnap turns a photo of your work schedule into editable calendar events in minutes',
    );
    expect(html).toContain('name="viewport"');
    expect(html).toContain('width=device-width, initial-scale=1.0, viewport-fit=cover');
  });
});
