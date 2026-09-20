import React from 'react';
import { X, HelpCircle, CheckCircle2, ShieldAlert, LogOut, QrCode, WifiOff, FileSpreadsheet, Lock } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Boarding House Gate Studio Guide</h3>
              <p className="text-xs text-slate-400">Sir Eugene Technologies • Operational Manual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Section 1 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>1. Reopening Arrival Desk (Mode 1)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              When students report at school reopening: Use the typeahead search or tap <strong>Scanner</strong> to scan their student barcode. In the check-in modal, inspect luggage for prohibited items, check off mandatory sanitary items (Broom, Brush, Disinfectant) and House Dues. Tap <strong>Confirm Arrival</strong> to update their status and automatically generate an SMS/WhatsApp arrival dispatch to their parents.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <LogOut className="w-4 h-4" />
              <span>2. Vacation &amp; Exeat Departure Desk (Mode 2)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              When school vacates or a student is granted an exeat permit: Select the student from the departure queue. Verify the Destination Town, confirm their room key has been handed over and their bunk is clean, and check the escort&apos;s National ID / Ghana Card. Click <strong>Authorize Departure &amp; Check-Out</strong> to mark them exited and alert their parents via WhatsApp.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-400 font-bold">
              <FileSpreadsheet className="w-4 h-4" />
              <span>3. Master House Roster &amp; Roll Sheet (Mode 3)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              View the entire student registry. Sort columns, upload existing school spreadsheets via CSV import, add new students, or click <strong>Print Roll Sheet</strong> to print formatted physical paper check-off rolls for dorm prefects.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>4. Attendance Analytics &amp; Defaulter Alerts (Mode 4)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              Track house-by-house arrival percentages. Students who fail to report within 48 hours are automatically flagged as <strong>Late Defaulters</strong>. Housemasters can send a single bulk SMS alert to all defaulter parents with one click or print official executive summary reports for the Headmaster.
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <WifiOff className="w-4 h-4" />
              <span>5. 100% Offline PWA &amp; Security PIN</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              This application is an offline-first PWA powered by a Cache-First Service Worker (`sw.js`). All records are stored locally on your device, enabling uninterrupted roll-call at security gates even without internet or electricity. Sensitive tasks (bulk imports, data wipe, student deletion) require the Senior Housemaster Security PIN (Default: <code className="bg-slate-800 px-1 py-0.5 rounded text-white font-mono">1234</code>).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
