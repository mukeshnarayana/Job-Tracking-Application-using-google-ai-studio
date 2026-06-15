import React from 'react';
import { Database, FileSpreadsheet, Lock, Sparkles, Wand2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthLayoutProps {
  onSignIn: () => void;
  isLoggingIn: boolean;
  onContinueGuest: () => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  onSignIn,
  isLoggingIn,
  onContinueGuest,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded border border-slate-200 shadow-xl"
        id="auth-card"
      >
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-50 rounded flex items-center justify-center text-blue-600 mb-4 border border-blue-100">
            <FileSpreadsheet className="h-6 w-6" id="brand-icon" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 uppercase font-sans" id="auth-title">
            AppTracker
          </h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto" id="auth-subtitle">
            Synchronize, review, and analyze your job submissions with Google Sheets acting as your primary, persistent database.
          </p>
        </div>

        <div className="space-y-4 my-8 bg-slate-50 p-5 rounded border border-slate-200" id="auth-features">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Features & Connectivity
          </h3>
          <div className="flex items-start space-x-3 text-sm">
            <div className="mt-0.5 text-emerald-600">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Direct Sheets Integration</p>
              <p className="text-slate-550 text-xs">Automatically creates and syncs with a <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1 py-0.5 rounded">Job Applications Tracker Database</span> spreadsheet on your Google Drive.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 text-sm">
            <div className="mt-0.5 text-blue-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Advanced Status Analytics</p>
              <p className="text-slate-550 text-xs">Beautiful visual charts tracking responses, salary profiles, offer pipelines, and weekly application trends.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 text-sm">
            <div className="mt-0.5 text-slate-600">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Local Cache Fallback</p>
              <p className="text-slate-550 text-xs">Build your pipeline immediately in temporary memory if you choose not to authenticate.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onSignIn}
            disabled={isLoggingIn}
            className={`gsi-material-button w-full flex items-center justify-center select-none rounded ${
              isLoggingIn ? 'opacity-50 cursor-wait' : 'cursor-pointer'
            }`}
            id="google-signin-btn"
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  style={{ display: 'block' }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents text-sm font-medium text-slate-700">
                {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
              </span>
            </div>
          </button>

          <button
            onClick={onContinueGuest}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-slate-200 rounded text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-colors"
            id="continue-guest-btn"
          >
            Create Locally (temporary memory)
          </button>
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-xs text-gray-400 justify-self-center mt-6">
          <Lock className="h-3 w-3" />
          <span>Secured Google Workspace Connection</span>
        </div>
      </motion.div>
    </div>
  );
};
