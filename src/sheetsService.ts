/**
 * Google Sheets and Authentication Service for Job Application Tracker
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { JobApplication, SpreadsheetMetadata, ApplicationStatus } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required Workspace scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let currentSpreadsheet: SpreadsheetMetadata | null = null;

// Temporary cache of loaded applications (useful for offline/sync actions)
let cachedApplications: JobApplication[] = [];

// Initialize Auth listener
export const initAuth = (
  onAuthSuccess: (user: User, token: string) => void,
  onAuthFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess(user, cachedAccessToken);
      } else {
        // If the user refreshed, Firebase persists the login session but we loose the access token
        // In this case, the user must click Sign-in again to re-authorize and populate the token.
        // We will notify the app shell to prompt a login or let the user know they need to sign in again.
        onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      currentSpreadsheet = null;
      onAuthFailure();
    }
  });
};

// Sign in via Google popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve the access token from Google Sign-In.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Core Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Log out user
export const logoutUser = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
  currentSpreadsheet = null;
  cachedApplications = [];
};

// Retrieve currently cached access token
export const getActiveToken = (): string | null => {
  return cachedAccessToken;
};

// Find existing Job Application Tracker Spreadsheet or create one
export const getOrCreateSpreadsheet = async (accessToken: string): Promise<SpreadsheetMetadata> => {
  if (currentSpreadsheet) {
    return currentSpreadsheet;
  }

  // 1. Search for an existing Spreadsheet named 'Job Applications Tracker Database'
  try {
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='Job%20Applications%20Tracker%20Database'%20and%20mimeType='application/vnd.google-apps.spreadsheet'%20and%20trashed=false&fields=files(id,name,webViewLink)`;
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchResponse.ok) {
      throw new Error(`Failed to search Drive: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    if (searchData.files && searchData.files.length > 0) {
      const file = searchData.files[0];
      
      // Fetch sheet ID of the first tab
      const metaResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${file.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (metaResponse.ok) {
        const metaData = await metaResponse.json();
        const sheetId = metaData.sheets?.[0]?.properties?.sheetId ?? 0;
        
        currentSpreadsheet = {
          spreadsheetId: file.id,
          title: file.name,
          spreadsheetUrl: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}`,
          sheetId: sheetId,
        };
        return currentSpreadsheet;
      }
    }
  } catch (err) {
    console.warn('Driver lookup failed, attempting to create clean sheet instead:', err);
  }

  // 2. Create the Spreadsheet if not found
  try {
    const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: 'Job Applications Tracker Database',
        },
        sheets: [
          {
            properties: {
              title: 'Applications',
            },
          },
        ],
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create spreadsheet: ${createResponse.statusText}`);
    }

    const sheetData = await createResponse.json();
    const spreadsheetId = sheetData.spreadsheetId;
    const sheetId = sheetData.sheets?.[0]?.properties?.sheetId ?? 0;
    const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    currentSpreadsheet = {
      spreadsheetId,
      title: 'Job Applications Tracker Database',
      spreadsheetUrl,
      sheetId,
    };

    // Initialize headers in the new sheet
    await initializeSpreadsheetSchema(spreadsheetId, accessToken);

    return currentSpreadsheet;
  } catch (error) {
    console.error('Error creating Spreadsheet:', error);
    throw error;
  }
};

// Initialize the spreadsheet headers
const initializeSpreadsheetSchema = async (spreadsheetId: string, accessToken: string): Promise<void> => {
  const headers = [
    'ID',
    'Company Name',
    'Role / Job Name',
    'Status',
    'Platform Name',
    'Location',
    'Contact Details',
    'Applied Date',
    'Salary',
    'Created At',
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Applications!A1:J1?valueInputOption=USER_ENTERED`;
  await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: 'Applications!A1:J1',
      majorDimension: 'ROWS',
      values: [headers],
    }),
  });
};

// Fetch all Applications from Google Sheet
export const fetchApplicationsFromSheet = async (
  spreadsheetId: string,
  accessToken: string
): Promise<JobApplication[]> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Applications!A:J`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get spreadsheet rows: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.values || data.values.length <= 1) {
    // If empty or only contains headers, write headers just in case and return empty
    if (!data.values || data.values.length === 0) {
      await initializeSpreadsheetSchema(spreadsheetId, accessToken);
    }
    return [];
  }

  // Parse values (skipping Row 0, which is the header)
  const rows = data.values.slice(1);
  const applications: JobApplication[] = rows.map((row: string[]) => {
    return {
      id: row[0] || '',
      companyName: row[1] || '',
      roleName: row[2] || '',
      status: (row[3] || 'applied') as ApplicationStatus,
      platformName: row[4] || '',
      location: row[5] || '',
      contactDetails: row[6] || '',
      appliedDate: row[7] || '',
      salary: row[8] || '',
      createdAt: row[9] || new Date().toISOString(),
    };
  });

  // Keep a local cached copy
  cachedApplications = applications;
  return applications;
};

// Add application row
export const addApplicationToSheet = async (
  spreadsheetId: string,
  accessToken: string,
  app: JobApplication
): Promise<void> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Applications!A:J:append?valueInputOption=USER_ENTERED`;
  
  const payload = [
    app.id,
    app.companyName,
    app.roleName,
    app.status,
    app.platformName,
    app.location,
    app.contactDetails,
    app.appliedDate,
    app.salary,
    app.createdAt,
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [payload],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to append application: ${response.statusText}`);
  }
};

// Update existing application row (locates row by matching item status or unique ID in column A)
export const updateApplicationInSheet = async (
  spreadsheetId: string,
  accessToken: string,
  app: JobApplication
): Promise<void> => {
  // 1. Fetch current Sheet contents to locate Row ID
  const listUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Applications!A:A`;
  const listResponse = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listResponse.ok) {
    throw new Error(`Failed to scan row IDs: ${listResponse.statusText}`);
  }

  const listData = await listResponse.json();
  const ids: string[][] = listData.values || [];
  
  // Columns are 0-indexed, rows are 1-indexed. Index 0 is header.
  const rowIndex = ids.findIndex((row) => row[0] === app.id) + 1;

  if (rowIndex <= 1) {
    throw new Error(`Unable to locate row index for Job Application ID: ${app.id}`);
  }

  // 2. Put specific row content
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Applications!A${rowIndex}:J${rowIndex}?valueInputOption=USER_ENTERED`;
  
  const payload = [
    app.id,
    app.companyName,
    app.roleName,
    app.status,
    app.platformName,
    app.location,
    app.contactDetails,
    app.appliedDate,
    app.salary,
    app.createdAt,
  ];

  const updateResponse = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `Applications!A${rowIndex}:J${rowIndex}`,
      majorDimension: 'ROWS',
      values: [payload],
    }),
  });

  if (!updateResponse.ok) {
    throw new Error(`Failed to update application row: ${updateResponse.statusText}`);
  }
};

// Delete app row using BatchUpdate (pulls list first to get correct row indices)
export const deleteApplicationFromSheet = async (
  spreadsheetId: string,
  sheetId: number,
  accessToken: string,
  appId: string
): Promise<void> => {
  // 1. Find correct row index
  const listUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Applications!A:A`;
  const listResponse = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listResponse.ok) {
    throw new Error(`Failed to locate target deletion index: ${listResponse.statusText}`);
  }

  const listData = await listResponse.json();
  const ids: string[][] = listData.values || [];
  const index = ids.findIndex((row) => row[0] === appId);

  if (index === -1) {
    throw new Error(`Failed to find target deletion row for App ID: ${appId}`);
  }

  // 2. Send batchUpdate to delete single index
  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const response = await fetch(batchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: index, // 0-based index is exactly the position of A in array of rows!
              endIndex: index + 1,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed deleting application row via Google Sheets batchUpdate: ${response.statusText}`);
  }
};
