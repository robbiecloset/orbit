export type Account = 'personal' | 'work';

export interface Issue {
  id: string;
  title: string;
  url: string;
  priority: number | null;
  priorityLabel: string | null;
  state: string;
  project: string | null;
  team: string;
  account: Account;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  calendar: string;
  account: Account;
  location?: string;
  description?: string;
}

export interface LinearResponse {
  personal: { issues: Issue[] };
  work: { issues: Issue[] };
}

export interface CalendarResponse {
  events: CalendarEvent[];
}

export interface ContextResponse {
  generatedAt: string;
  linear: LinearResponse;
  calendar: CalendarResponse;
}
