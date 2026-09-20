import React from 'react';
import { X, Printer } from 'lucide-react';
import { Student, SystemSettings } from '../types';

interface PrintSummaryReportProps {
  students: Student[];
  settings: SystemSettings;
  houses: string[];
  onClose: () => void;
}

export const PrintSummaryReport: React.FC<PrintSummaryReportProps> = ({
  students,
  settings,
  houses,
  onClose
}) => {
  const total = students.length;
  const arrived = students.filter(s => s.status === 'in_dorm').length;
  const checkedOut = students.filter(s => s.status === 'checked_out').length;
  const pending = students.filter(s => s.status === 'pending_arrival').length;
  const duesPaid = students.filter(s => s.houseItems.houseDuesPaid).length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white text-black rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto print:p-0 print:max-h-none print:shadow-none print:w-full print:rounded-none">
        {/* Screen Controls */}
        <div className="no-print flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Official Housemaster Summary Report</h3>
            <p className="text-xs text-gray-600">Executive executive document for Headmaster &amp; Board of Governors</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document */}
        <div>
          <div className="text-center pb-4 border-b-2 border-black">
            <h1 className="text-xl font-black uppercase tracking-wider">{settings.schoolName}</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-700">
              OFFICE OF THE SENIOR HOUSEMASTER • BOARDING DEPARTMENT
            </p>
            <h2 className="text-base font-extrabold uppercase mt-1 underline">
              BOARDING HOUSE ARRIVAL &amp; DEPARTURE EXECUTIVE SUMMARY REPORT
            </h2>
            <div className="mt-3 flex justify-between text-xs font-semibold px-4">
              <span>ACADEMIC YEAR: <strong>{settings.academicYear}</strong></span>
              <span>TERM STATUS: <strong>{settings.currentTerm}</strong></span>
              <span>REPORT DATE: <strong>{new Date().toLocaleDateString('en-GB')}</strong></span>
            </div>
          </div>

          {/* KPI Summary Block */}
          <div className="my-6 grid grid-cols-4 gap-3 border border-black p-3 text-center">
            <div className="border-r border-black pr-2">
              <span className="text-[10px] uppercase font-bold text-gray-600 block">Total Boarders</span>
              <span className="text-xl font-black">{total}</span>
            </div>
            <div className="border-r border-black pr-2">
              <span className="text-[10px] uppercase font-bold text-gray-600 block">Reported In Dorm</span>
              <span className="text-xl font-black text-emerald-800">{arrived} ({((arrived / total) * 100).toFixed(1)}%)</span>
            </div>
            <div className="border-r border-black pr-2">
              <span className="text-[10px] uppercase font-bold text-gray-600 block">Late Defaulters</span>
              <span className="text-xl font-black text-rose-800">{pending}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-600 block">Checked Out / Exeat</span>
              <span className="text-xl font-black">{checkedOut}</span>
            </div>
          </div>

          {/* House Breakdown Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase mb-2">Turnout Distribution By House:</h4>
            <table className="w-full text-left text-xs border-collapse border border-black">
              <thead>
                <tr className="bg-gray-100 border-b border-black">
                  <th className="border border-black p-1.5">House Name</th>
                  <th className="border border-black p-1.5 text-center">Total Capacity</th>
                  <th className="border border-black p-1.5 text-center">Arrived Present</th>
                  <th className="border border-black p-1.5 text-center">Vacated / Exeat</th>
                  <th className="border border-black p-1.5 text-center">Defaulters</th>
                  <th className="border border-black p-1.5 text-center">Turnout %</th>
                </tr>
              </thead>
              <tbody>
                {houses.map(h => {
                  const houseStuds = students.filter(s => s.house === h);
                  const arr = houseStuds.filter(s => s.status === 'in_dorm').length;
                  const ex = houseStuds.filter(s => s.status === 'checked_out').length;
                  const def = houseStuds.filter(s => s.status === 'pending_arrival').length;
                  const pct = houseStuds.length > 0 ? ((arr / houseStuds.length) * 100).toFixed(1) : '0';
                  return (
                    <tr key={h} className="border-b border-black">
                      <td className="border border-black p-1.5 font-bold">{h}</td>
                      <td className="border border-black p-1.5 text-center">{houseStuds.length}</td>
                      <td className="border border-black p-1.5 text-center font-semibold">{arr}</td>
                      <td className="border border-black p-1.5 text-center">{ex}</td>
                      <td className="border border-black p-1.5 text-center font-semibold">{def}</td>
                      <td className="border border-black p-1.5 text-center font-mono font-bold">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* House Items & Compliance Note */}
          <div className="border border-black p-3 text-xs mb-8 space-y-1">
            <p className="font-bold uppercase">Sanitary Items &amp; House Dues Audit Summary:</p>
            <p className="text-gray-700">
              Total students with House Dues paid: <strong>{duesPaid} / {total} ({((duesPaid / total) * 100).toFixed(0)}%)</strong>.
              All incoming luggage inspections were strictly conducted in accordance with Boarding School Disciplinary Regulations. Flagged items withheld at the security desk have been logged in the official Movement Ledger.
            </p>
          </div>

          {/* Official Signatures */}
          <div className="grid grid-cols-2 gap-12 text-xs pt-8 border-t-2 border-black">
            <div>
              <p className="font-bold">Prepared By:</p>
              <div className="h-12 border-b border-black mt-2"></div>
              <p className="font-bold text-gray-900 mt-1">{settings.officerName}</p>
              <p className="text-gray-600 text-[11px]">Senior Housemaster</p>
            </div>
            <div>
              <p className="font-bold">Received &amp; Approved By:</p>
              <div className="h-12 border-b border-black mt-2"></div>
              <p className="font-bold text-gray-900 mt-1">The Headmaster / Principal</p>
              <p className="text-gray-600 text-[11px]">St. Eugene Senior High &amp; Boarding School</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
