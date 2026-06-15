export type ApplicationStatus =
  | 'applied'
  | 'reply'
  | 'no reply'
  | 'shortlisted'
  | 'not shortlisted'
  | 'selected'
  | 'notselected'
  | 'rejected';

export interface JobApplication {
  id: string;
  companyName: string;
  roleName: string;
  status: ApplicationStatus;
  platformName: string;
  location: string;
  contactDetails: string;
  appliedDate: string;
  salary: string;
  createdAt: string;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheetId: number;
}
