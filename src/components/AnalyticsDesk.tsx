import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  FileSpreadsheet,
  Printer,
  Clock,
  Phone,
  MessageCircle,
  Download,
  Building2,
  Calendar,
  Sparkles,
  Search,
  Send
} from 'lucide-react';
import { Student, MovementAuditLog, SystemSettings } from '../types';
import { soundManager } from '../utils/audio';
import { exportMovementAuditLogCSV } from '../utils/storage';

interface AnalyticsDeskProps {
  students: Student[];
  logs: MovementAuditLog[];
  settings: SystemSettings;
  onOpenPrintSummaryReport: () => void;
  selectedHouse: string;
  houses: string[];
}

export const AnalyticsDesk: React.FC<AnalyticsDeskProps> = ({
  students,
  logs,
  settings,
  onOpenPrintSummaryReport,
  selectedHouse,
  houses
}) => {
  const [auditSearch, setAuditSearch] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'all' | 'arrival' | 'departure'>('all');

  // Filter students based on house selection
  const houseStudents = useMemo(() => {
    return selectedHouse === 'All Houses'
      ? students
      : students.filter(s => s.house === selectedHouse);
  }, [students, selectedHouse]);

  // Calculations
  const totalBoarders = houseStudents.length;
  const arrivedCount = houseStudents.filter(s => s.status === 'in_dorm').length;
  const checkedOutCount = houseStudents.filter(s => s.status === 'checked_out').length;
  const pendingCount = houseStudents.filter(s => s.status === 'pending_arrival').length;
  const arrivedPercent = totalBoarders > 0 ? ((arrivedCount / totalBoarders) * 100).toFixed(1) : '0.0';

  // Defaulters: pending students who have not checked in within the reopening deadline (e.g. 48 hours)
  const defaulters = useMemo(() => {
    return houseStudents.filter(s => s.status === 'pending_arrival');
  }, [houseStudents]);

  // House items compliance
  const houseItemsPaid = houseStudents.filter(s => s.houseItems.houseDuesPaid).length;
  const duesPercent = totalBoarders > 0 ? ((houseItemsPaid / totalBoarders) * 100).toFixed(0) : '0';

  // House-by-house breakdown
  const houseBreakdowns = useMemo(() => {
    return houses.map(houseName => {
      const studs = students.filter(s => s.house === houseName);
      const arr = studs.filter(s => s.status === 'in_dorm').length;
      const pct = studs.length > 0 ? ((arr / studs.length) * 100).toFixed(0) : '0';
      return {
        houseName,
        total: studs.length,
        arrived: arr,
        percent: Number(pct)
      };
    });
  }, [students, houses]);

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedHouse !== 'All Houses' && log.house !== selectedHouse) {
        return false;
      }
      if (auditTypeFilter !== 'all' && log.type !== auditTypeFilter) {
        return false;
      }
      if (!auditSearch.trim()) return true;
      const q = auditSearch.toLowerCase();
      return (
        log.studentName.toLowerCase().includes(q) ||
        log.studentId.toLowerCase().includes(q) ||
        log.room.toLowerCase().includes(q) ||
        log.officerName.toLowerCase().includes(q)
      );
    });
  }, [logs, selectedHouse, auditTypeFilter, auditSearch]);

  const generateBulkDefaulterSMS = () => {
    soundManager.playButtonClick();
    const phoneList = defaulters
      .map(s => s.parentPhone.replace(/[^0-9+]/g, ''))
      .filter(Boolean)
      .join(',');
    const message = `URGENT NOTICE: Your ward has not reported to St. Eugene Boarding House for mandatory reopening roll-call. Please contact Senior Housemaster immediately.`;
    return `sms:${phoneList}?body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-3 sm:p-5 space-y-5">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Boarders */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Boarders</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{totalBoarders}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Enrolled on Master Roll</p>
          </div>
        </div>

        {/* Total Checked In */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-900/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Checked-In Turnout</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
              {arrivedCount} <span className="text-sm font-medium text-emerald-300/70">({arrivedPercent}%)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">In Dormitory Present</p>
          </div>
        </div>

        {/* Expected / Late Defaulters */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-rose-900/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Expected Defaulters</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-rose-400 tracking-tight">{defaulters.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">&gt; 48hrs Past Reopening</p>
          </div>
        </div>

        {/* Total Checked Out */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-900/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Total Checked-Out</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-amber-300 tracking-tight">{checkedOutCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Vacated / On Exeat</p>
          </div>
        </div>
      </div>

      {/* House-by-House Turnout Progress Bars & Housemaster Reports Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* House Turnout Progress */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">House-By-House Reopening Turnout</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Dues Paid: {duesPercent}%</span>
          </div>

          <div className="space-y-3">
            {houseBreakdowns.map(item => (
              <div key={item.houseName} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-200 font-medium">{item.houseName}</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    {item.arrived} / {item.total} ({item.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Official Export & Actions Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Printer className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Official Executive Reports</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate formatted PDF/print summaries for the Headmaster, Senior Housemaster, and Boarding Committee.
            </p>
          </div>

          <div className="space-y-2.5">
            {/* Export House Master Summary Report (PDF/Print) */}
            <button
              onClick={() => {
                soundManager.playButtonClick();
                onOpenPrintSummaryReport();
              }}
              className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>📊 Export House Master Summary Report</span>
            </button>

            {/* Export Movement Audit Log (CSV) */}
            <button
              onClick={() => {
                soundManager.playButtonClick();
                exportMovementAuditLogCSV(logs);
              }}
              className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              <span>📑 Export Movement Audit Log (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Defaulter Tracking Section with Bulk SMS */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-rose-900/30 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Reopening Defaulters ({defaulters.length} Pending)
              </h3>
              <p className="text-[11px] text-slate-400">Students overdue &gt; 48 hours without gate clearance</p>
            </div>
          </div>

          {defaulters.length > 0 && (
            <a
              href={generateBulkDefaulterSMS()}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-950/40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Bulk SMS Overdue Parents ({defaulters.length})</span>
            </a>
          )}
        </div>

        {defaulters.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-400">
            🎉 All boarders in this house have safely reported or are cleared! Zero defaulters recorded.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {defaulters.map(student => (
              <div
                key={student.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-rose-900/30 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{student.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {student.id} • {student.house} • {student.room}
                  </div>
                  <div className="text-[11px] text-rose-400 mt-0.5">Parent: {student.parentName}</div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`tel:${student.parentPhone.replace(/[^0-9+]/g, '')}`}
                    title="Direct Call Parent"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`sms:${student.parentPhone.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(
                      `URGENT: ${student.name} has not reported to ${student.house} for reopening roll-call. Please contact Housemaster immediately.`
                    )}`}
                    title="Direct SMS Reminder"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Movement Audit Log Chronological Ledger */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-md p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Movement Audit Log &amp; Security Ledger</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter by Arrival or Departure */}
            <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs">
              <button
                onClick={() => setAuditTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md transition ${auditTypeFilter === 'all' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setAuditTypeFilter('arrival')}
                className={`px-2.5 py-1 rounded-md transition ${auditTypeFilter === 'arrival' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400'}`}
              >
                Arrivals
              </button>
              <button
                onClick={() => setAuditTypeFilter('departure')}
                className={`px-2.5 py-1 rounded-md transition ${auditTypeFilter === 'departure' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400'}`}
              >
                Departures
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder="Search ledger..."
                className="pl-8 pr-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 sticky top-0 z-10 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">House &amp; Room</th>
                <th className="py-2.5 px-3">Escort / Transit</th>
                <th className="py-2.5 px-3">Clearance Notes</th>
                <th className="py-2.5 px-3">Logging Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No movement events found in audit records.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isArr = log.type === 'arrival';

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isArr
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isArr ? '📥 Arrival' : '📤 Exit'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-white">{log.studentName}</span>
                        <span className="text-[10px] font-mono text-slate-400 block">{log.studentId}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {log.house} • {log.room}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {isArr ? log.accompaniedBy || 'Parent' : log.escortName || 'Self / Transit'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                        {log.luggageNotes || (log.destinationTown ? `To: ${log.destinationTown}` : 'Cleared')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                        {log.officerName}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
