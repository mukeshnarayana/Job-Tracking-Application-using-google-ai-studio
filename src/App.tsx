import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { JobApplication, SpreadsheetMetadata } from './types';
import {
  initAuth,
  googleSignIn,
  logoutUser,
  getOrCreateSpreadsheet,
  fetchApplicationsFromSheet,
  addApplicationToSheet,
  updateApplicationInSheet,
  deleteApplicationFromSheet,
} from './sheetsService';

// Custom Components
import { AuthLayout } from './components/AuthLayout';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { ApplicationTable } from './components/ApplicationTable';
import { ApplicationModal } from './components/ApplicationModal';

// Icons
import {
  Briefcase,
  ExternalLink,
  LogOut,
  RefreshCw,
  Plus,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  CloudLightning,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';

// Pre-seeded Mock Data for Guest Mode to demonstrate dashboard graphics instantly!
const INITIAL_DEMO_DATA: JobApplication[] = [
  {
    id: 'demo-1',
    companyName: 'Stripe',
    roleName: 'Senior Systems Engineer',
    status: 'shortlisted',
    platformName: 'LinkedIn',
    location: 'Remote (US)',
    contactDetails: 'Recruiter: sarah@stripe.com',
    appliedDate: '2026-06-08',
    salary: '18,50,000/yr',
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-2',
    companyName: 'Google',
    roleName: 'Frontend Engineer',
    status: 'selected',
    platformName: 'Direct Portal',
    location: 'Mountain View, CA',
    contactDetails: 'applied-jobs@google.com',
    appliedDate: '2026-06-10',
    salary: '24,00,000/yr',
    createdAt: new Date(Date.now() - 4 * 24 * 3605 * 1000).toISOString(),
  },
  {
    id: 'demo-3',
    companyName: 'Microsoft',
    roleName: 'Solutions Engineer',
    status: 'applied',
    platformName: 'Indeed',
    location: 'Redmond, WA',
    contactDetails: 'hr@microsoft.com',
    appliedDate: '2026-06-12',
    salary: '16,50,000/yr',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-4',
    companyName: 'Netflix',
    roleName: 'Client Developer',
    status: 'reply',
    platformName: 'Twitter / X',
    location: 'Los Gatos, CA',
    contactDetails: 'DM to Hiring Manager',
    appliedDate: '2026-06-14',
    salary: '32,00,000/yr',
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-5',
    companyName: 'Vercel',
    roleName: 'Product Specialist',
    status: 'rejected',
    platformName: 'LinkedIn',
    location: 'Remote (US)',
    contactDetails: 'noreply@vercel.com',
    appliedDate: '2026-06-15',
    salary: '14,00,000/yr',
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLosingAuthSession, setIsLosingAuthSession] = useState(false);
  const [needsAuthPage, setNeedsAuthPage] = useState<boolean | null>(null); // null = waiting, true = show auth, false = show app
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sheets sync data
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetMetadata | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local' | 'syncing' | 'error'>('local');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, activeToken) => {
        setUser(user);
        setToken(activeToken);
        setNeedsAuthPage(false);
        setSyncStatus('synced');
        initializeSheetsSync(activeToken);
      },
      () => {
        // Fallback or user not logged in
        setUser(null);
        setToken(null);
        // By default on start, we don't force the login gate if they want to browse as guests first,
        // but if they explicitly triggered a reload or were already logged out:
        if (needsAuthPage === null) {
          // First load, let's open the dashboard directly in guest mode for standard immediate execution
          setNeedsAuthPage(false);
          setApplications(INITIAL_DEMO_DATA);
          setSyncStatus('local');
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync / fetch spreadsheet records
  const initializeSheetsSync = async (accessToken: string) => {
    setIsLoading(true);
    setSyncStatus('syncing');
    setErrorNotice(null);
    try {
      const sheetMeta = await getOrCreateSpreadsheet(accessToken);
      setSpreadsheet(sheetMeta);
      const rows = await fetchApplicationsFromSheet(sheetMeta.spreadsheetId, accessToken);
      setApplications(rows);
      setSyncStatus('synced');
      triggerSuccessToast('Data synced with Google Sheets.');
    } catch (err: any) {
      console.error('Spreadsheet Sync Error:', err);
      setSyncStatus('error');
      setErrorNotice(`Google Sheet connection error: ${err.message || 'Access Denied'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const manualSheetRefresh = () => {
    if (token) {
      initializeSheetsSync(token);
    }
  };

  const triggerSuccessToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Google Sign In trigger
  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorNotice(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuthPage(false);
        triggerSuccessToast('Successfully signed in with Google!');
        
        // If they had temporary local applications they created while logged out,
        // we can merge them to sheets as a friendly service!
        const localItems = applications.filter(a => a.id.startsWith('demo-') === false);
        await initializeSheetsSync(result.accessToken);

        if (localItems.length > 0) {
          setIsLoading(true);
          setSyncStatus('syncing');
          setErrorNotice('Syncing your local items with Google Sheets...');
          try {
            const sheetMeta = await getOrCreateSpreadsheet(result.accessToken);
            for (const item of localItems) {
              await addApplicationToSheet(sheetMeta.spreadsheetId, result.accessToken, item);
            }
            // re-fetch
            const merged = await fetchApplicationsFromSheet(sheetMeta.spreadsheetId, result.accessToken);
            setApplications(merged);
            setSyncStatus('synced');
            triggerSuccessToast(`Successfully merged ${localItems.length} unsaved local list items to sheets!`);
          } catch (mergeErr) {
            console.error('Merging local items failed:', mergeErr);
            setErrorNotice('Failed to automatically merge local items to your Sheets database.');
          } finally {
            setIsLoading(false);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorNotice(err.message || 'Authentication flow failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign out
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setToken(null);
      setSpreadsheet(null);
      // Reset back to beautiful simulation demo data so user doesn't hit empty UI
      setApplications(INITIAL_DEMO_DATA);
      setSyncStatus('local');
      triggerSuccessToast('Logged out. Reverted to Guest Mode.');
    } catch (err: any) {
      console.error(err);
      setErrorNotice('Log out failure.');
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD Actions
  const handleSaveApplication = async (app: JobApplication) => {
    setErrorNotice(null);
    
    // Check if updating or creating
    const isEdit = applications.some((existing) => existing.id === app.id);

    if (token && spreadsheet) {
      // Direct Sheets DB Mode
      setSyncStatus('syncing');
      try {
        if (isEdit) {
          await updateApplicationInSheet(spreadsheet.spreadsheetId, token, app);
          setApplications((prev) => prev.map((item) => (item.id === app.id ? app : item)));
          triggerSuccessToast(`Updated ${app.companyName} row entries in your Google Sheet.`);
        } else {
          await addApplicationToSheet(spreadsheet.spreadsheetId, token, app);
          setApplications((prev) => [app, ...prev]);
          triggerSuccessToast(`Added ${app.companyName} entry to your Google Sheet.`);
        }
        setSyncStatus('synced');
      } catch (err: any) {
        setSyncStatus('error');
        setErrorNotice(`Google Sheets write failure: ${err.message || err}`);
        throw err;
      }
    } else {
      // In-Memory Guest Mode
      if (isEdit) {
        setApplications((prev) => prev.map((item) => (item.id === app.id ? app : item)));
        triggerSuccessToast(`Local entry for ${app.companyName} updated.`);
      } else {
        setApplications((prev) => [app, ...prev]);
        triggerSuccessToast(`Added ${app.companyName} to local memory.`);
      }
    }
  };

  const handleDeleteApplication = async (id: string, company: string, role: string) => {
    // Explicit workspace user confirmation requirement
    const confirmation = window.confirm(
      `Are you sure you want to permanently delete the application for "${role}" at "${company}" from your database logs? This action will edit your Google Sheet cells directly.`
    );
    if (!confirmation) return;

    setErrorNotice(null);

    if (token && spreadsheet) {
      setIsLoading(true);
      setSyncStatus('syncing');
      try {
        await deleteApplicationFromSheet(spreadsheet.spreadsheetId, spreadsheet.sheetId, token, id);
        setApplications((prev) => prev.filter((item) => item.id !== id));
        triggerSuccessToast(`Deleted ${company} entry row from Sheets.`);
        setSyncStatus('synced');
      } catch (err: any) {
        setSyncStatus('error');
        setErrorNotice(`Failed to delete spreadsheet row: ${err.message || err}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local Mode Deletion
      setApplications((prev) => prev.filter((item) => item.id !== id));
      triggerSuccessToast(`Deleted ${company} locally.`);
    }
  };

  const handleEditTrigger = (app: JobApplication) => {
    setEditingApp(app);
    setIsModalOpen(true);
  };

  const handleNewTrigger = () => {
    setEditingApp(null);
    setIsModalOpen(true);
  };

  // Wait for initial auth state lookup to complete
  if (needsAuthPage === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-sans">Bootstrapping database credentials...</p>
        </div>
      </div>
    );
  }

  // If the page needs forced authentication
  if (needsAuthPage) {
    return (
      <AuthLayout
        onSignIn={handleSignIn}
        isLoggingIn={isLoggingIn}
        onContinueGuest={() => setNeedsAuthPage(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900 selection:bg-blue-50 selection:text-blue-900">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-blue-600 text-white rounded flex items-center justify-center shadow-sm">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 uppercase tracking-tight flex items-center">
                AppTracker
                <span className="ml-2 font-normal text-slate-400 lowercase text-xs">
                  v2.0
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3" id="database-meta-header">
            {/* Sync Pill indicators */}
            {syncStatus === 'synced' && spreadsheet && (
              <div className="hidden sm:flex items-center space-x-2 bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Connected to Google Sheets
              </div>
            )}

            {syncStatus === 'local' && (
              <div className="hidden sm:flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1 rounded-full font-semibold">
                <CloudLightning className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="font-medium">Sandbox Mode (Guest)</span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              </div>
            )}

            {syncStatus === 'syncing' && (
              <div className="hidden sm:flex items-center space-x-2 bg-blue-50 border border-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold">
                <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin shrink-0" />
                <span className="font-medium">Updating cloud rows...</span>
              </div>
            )}

            {token ? (
              <div className="flex items-center space-x-2">
                {/* View Sheet in browser */}
                {spreadsheet && (
                  <a
                    href={spreadsheet.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded border border-slate-200 text-xs font-semibold bg-white cursor-pointer select-none"
                    title="Open sheet in new window"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="hidden md:inline">Open Sheets Database</span>
                    <ExternalLink className="h-3 w-3 inline text-slate-400" />
                  </a>
                )}
                {/* Manual cloud refresh */}
                <button
                  type="button"
                  onClick={manualSheetRefresh}
                  disabled={isLoading}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 bg-white transition-colors cursor-pointer select-none"
                  title="Manual cloud spreadsheet poll"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 bg-white transition-colors text-xs font-semibold flex items-center space-x-1 cursor-pointer select-none"
                  title="Sign out of Google Sheets"
                  id="signout-header-btn"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Disconnect</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isLoggingIn}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs tracking-wide shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 select-none"
                id="signin-header-btn"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>{isLoggingIn ? 'Connecting...' : 'Connect Google Sheets'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Layout Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Dynamic Success Toast / Notifications */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
            <span className="text-[10px] text-emerald-400 select-none uppercase font-semibold">Saved</span>
          </motion.div>
        )}

        {/* Global Warning notice banner */}
        {errorNotice && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-start space-x-2.5 animate-fade-in" id="error-alert">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Database Exception Alert</span>
              <p className="text-rose-600">{errorNotice}</p>
            </div>
          </div>
        )}

        {/* Demo Mode warning banner if user hasn't synced spreadsheet */}
        {!token && (
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/40 border border-amber-200/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="demo-mode-header-alert">
            <div className="flex space-x-3 items-start">
              <div className="h-9 w-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0 border border-amber-200">
                <CloudLightning className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-amber-900">Running in Sandbox Memory (Guest)</h4>
                <p className="text-xs text-amber-750 text-amber-700 max-w-2xl leading-relaxed">
                  Your added job applications are stored in temporary browser state memory. **If you refresh or close this tab, your data will clear completely.** Please click &quot;Connect Google Sheets&quot; to establish a permanent spreadsheet table backend.
                </p>
              </div>
            </div>
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center space-x-1"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>{isLoggingIn ? 'Connecting...' : 'Authorize Cloud Sync'}</span>
            </button>
          </div>
        )}

        {/* Analytics Section */}
        <section className="space-y-3" id="analytics-section">
          <div className="flex items-center space-x-2 px-1">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metrics & Pipeline Visualization</h2>
          </div>
          <AnalyticsPanel applications={applications} />
        </section>

        {/* Applications Database Grid Table */}
        <section className="space-y-4" id="table-section">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-slate-500" />
              <h2 className="text-base font-bold text-slate-800">Job Submissions Ledger</h2>
            </div>
            <button
              onClick={handleNewTrigger}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded shadow-sm hover:shadow-md flex items-center space-x-1.5 transition-all select-none cursor-pointer"
              id="new-app-btn"
            >
              <Plus className="h-4 w-4" />
              <span>Add Job Log</span>
            </button>
          </div>

          <ApplicationTable
            applications={applications}
            onEdit={handleEditTrigger}
            onDelete={handleDeleteApplication}
          />
        </section>
      </main>

      {/* Add / Edit Form Overlay Modal Dialog */}
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveApplication}
        editingApp={editingApp}
      />
    </div>
  );
}
