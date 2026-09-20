import React from 'react';
import { X, Printer } from 'lucide-react';
import { Student } from '../types';

interface PrintRollSheetProps {
  students: Student[];
  selectedHouse: string;
  onClose: () => void;
}

export const PrintRollSheet: React.FC<PrintRollSheetProps> = ({
  students,
  selectedHouse,
  onClose
}) => {
  const filtered = selectedHouse === 'All Houses'
    ? students
    : students.filter(s => s.house === selectedHouse);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white text-black rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto print:p-0 print:max-h-none print:shadow-none print:w-full print:rounded-none">
        {/* Screen Controls Header (hidden during print) */}
        <div className="no-print flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Physical House Roll-Call Sheet</h3>
            <p className="text-xs text-gray-600">Official checklist for dorm prefect inspections &amp; gate checks</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Content */}
        <div>
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-black">
            <h1 className="text-xl font-black uppercase tracking-wider">
              St. Eugene Senior High &amp; Boarding School
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-700">
              Boarding House Department • Master Inspection Roll Sheet
            </p>
            <div className="mt-2 flex justify-between text-xs font-semibold px-4">
              <span>HOUSE: <strong>{selectedHouse.toUpperCase()}</strong></span>
              <span>ACADEMIC TERM: <strong>2025/2026 REOPENING</strong></span>
              <span>DATE GENERATED: <strong>{new Date().toLocaleDateString('en-GB')}</strong></span>
            </div>
          </div>

          {/* Table */}
          <table className="w-full mt-4 text-left text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="border border-black p-1.5 text-center w-8">#</th>
                <th className="border border-black p-1.5 w-24">ID</th>
                <th className="border border-black p-1.5">Student Full Name</th>
                <th className="border border-black p-1.5 w-28">Class</th>
                <th className="border border-black p-1.5 w-28">Room &amp; Bed</th>
                <th className="border border-black p-1.5 w-20 text-center">Status</th>
                <th className="border border-black p-1.5 w-16 text-center">Broom</th>
                <th className="border border-black p-1.5 w-16 text-center">Brush</th>
                <th className="border border-black p-1.5 w-16 text-center">Dues</th>
                <th className="border border-black p-1.5 w-24">Sign / Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr key={s.id} className="border-b border-gray-300 print-break-inside-avoid">
                  <td className="border border-black p-1 text-center font-mono text-[11px]">{idx + 1}</td>
                  <td className="border border-black p-1 font-mono text-[11px]">{s.id}</td>
                  <td className="border border-black p-1 font-semibold">{s.name}</td>
                  <td className="border border-black p-1 text-[11px]">{s.class}</td>
                  <td className="border border-black p-1 text-[11px]">{s.room} / {s.bedNumber}</td>
                  <td className="border border-black p-1 text-center font-bold text-[10px]">
                    {s.status === 'in_dorm' ? 'PRESENT' : s.status === 'checked_out' ? 'EXITED' : 'PENDING'}
                  </td>
                  <td className="border border-black p-1 text-center">{s.houseItems.broom ? '✓' : ''}</td>
                  <td className="border border-black p-1 text-center">{s.houseItems.scrubbingBrush ? '✓' : ''}</td>
                  <td className="border border-black p-1 text-center font-semibold">{s.houseItems.houseDuesPaid ? 'PAID' : ''}</td>
                  <td className="border border-black p-1 text-center text-[10px] text-gray-400">________</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Verification Sign-Off Footer */}
          <div className="mt-8 pt-4 border-t border-black grid grid-cols-3 gap-6 text-xs print-break-inside-avoid">
            <div>
              <p className="font-bold">House Prefect Endorsement:</p>
              <div className="h-10 border-b border-black mt-2"></div>
              <p className="text-[10px] text-gray-600 mt-1">Signature &amp; Date</p>
            </div>
            <div>
              <p className="font-bold">House Tutor Inspection:</p>
              <div className="h-10 border-b border-black mt-2"></div>
              <p className="text-[10px] text-gray-600 mt-1">Signature &amp; Date</p>
            </div>
            <div>
              <p className="font-bold">Senior Housemaster Approval:</p>
              <div className="h-10 border-b border-black mt-2"></div>
              <p className="text-[10px] text-gray-600 mt-1">Stamp &amp; Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
