import React, { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { X, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (app: JobApplication) => Promise<void>;
  editingApp: JobApplication | null;
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'applied', label: 'Applied' },
  { value: 'reply', label: 'Reply Received' },
  { value: 'no reply', label: 'No Reply / Awaiting' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'not shortlisted', label: 'Not Shortlisted' },
  { value: 'selected', label: 'Selected / Offer' },
  { value: 'notselected', label: 'Not Selected' },
  { value: 'rejected', label: 'Rejected' },
];

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingApp,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('applied');
  const [platformName, setPlatformName] = useState('');
  const [location, setLocation] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [salary, setSalary] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default values during edit or reset on create
  useEffect(() => {
    if (editingApp) {
      setCompanyName(editingApp.companyName);
      setRoleName(editingApp.roleName);
      setStatus(editingApp.status);
      setPlatformName(editingApp.platformName);
      setLocation(editingApp.location);
      setContactDetails(editingApp.contactDetails);
      setAppliedDate(editingApp.appliedDate || new Date().toISOString().split('T')[0]);
      setSalary(editingApp.salary);
    } else {
      setCompanyName('');
      setRoleName('');
      setStatus('applied');
      setPlatformName('');
      setLocation('');
      setContactDetails('');
      setAppliedDate(new Date().toISOString().split('T')[0]);
      setSalary('');
    }
    setError(null);
  }, [editingApp, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Company Name is required.');
      return;
    }
    if (!roleName.trim()) {
      setError('Role or Job Name is required.');
      return;
    }
    if (!appliedDate) {
      setError('Applied Date is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const appData: JobApplication = {
        id: editingApp ? editingApp.id : `app-${crypto.randomUUID()}`,
        companyName: companyName.trim(),
        roleName: roleName.trim(),
        status,
        platformName: platformName.trim() || 'Direct',
        location: location.trim() || 'Remote',
        contactDetails: contactDetails.trim(),
        appliedDate: appliedDate,
        salary: salary.trim(),
        createdAt: editingApp ? editingApp.createdAt : new Date().toISOString(),
      };

      await onSave(appData);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while saving the application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-500/30 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white rounded shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden z-10"
            id="builder-modal"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800 font-sans" id="modal-title">
                {editingApp ? 'Update Application Entry' : 'Log New Job Application'}
              </h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-655 hover:text-slate-600 rounded p-1 hover:bg-slate-100 transition-colors"
                id="close-modal-btn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200 flex space-x-2 items-start animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Row 1: Company & Role */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-sm border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/10 transition-all font-sans bg-slate-50/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Role / Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full text-sm border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/10 transition-all font-sans bg-slate-50/20"
                  />
                </div>
              </div>

              {/* Row 2: Status & Salary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                    className="w-full text-sm border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/10 transition-all bg-white font-sans"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Salary / Compensation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15,00,000/yr or 75,000/mo"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full text-sm border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/10 transition-all font-sans bg-slate-50/20"
                  />
                </div>
              </div>

              {/* Row 3: Platform & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Platform / Channel
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LinkedIn, Indeed, Company Site"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="w-full text-sm border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/10 transition-all font-sans bg-slate-50/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Job Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Remote, Seattle WA, Hybrid"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-sm border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/10 transition-all font-sans bg-slate-50/20"
                  />
                </div>
              </div>

              {/* Row 4: Contact Details & Applied Date */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Contact Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Recruiter: sarah@google.com or job portal link"
                    value={contactDetails}
                    onChange={(e) => setContactDetails(e.target.value)}
                    className="w-full text-sm border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/10 transition-all font-sans bg-slate-50/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Applied Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={appliedDate}
                      onChange={(e) => setAppliedDate(e.target.value)}
                      className="w-full text-sm border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/10 transition-all bg-white font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 bg-slate-50 flex justify-end space-x-3 border-t border-slate-200 mt-6 -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-150 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none rounded shadow-sm flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-wait"
                  id="save-app-btn"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? 'Saving...' : editingApp ? 'Update Entry' : 'Log Application'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
