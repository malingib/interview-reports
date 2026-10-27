import Dexie, { type EntityTable } from 'dexie';

export type ReportRecord = {
  id: string;
  title: string;
  sourceText: string;
  reportText: string;
  createdAt: string;
  updatedAt: string;
};

class InterviewReportsDB extends Dexie {
  reports!: EntityTable<ReportRecord, 'id'>;

  constructor() {
    super('interview-reports-local');
    this.version(1).stores({
      reports: 'id, title, createdAt, updatedAt'
    });
  }
}

// Only instantiate IndexedDB in a browser; no server/cloud database is used.
export const db = typeof window !== 'undefined' ? new InterviewReportsDB() : null;
