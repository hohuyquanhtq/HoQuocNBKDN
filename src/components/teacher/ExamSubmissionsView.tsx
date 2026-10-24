import React, { useState } from 'react';
import { ExamSubmission, Exam } from '../../types/index.ts';
import { formatScore } from '../../services/scoring.ts';
import { Award, Users, Search, Filter, Eye, Calendar, Clock, BarChart3 } from 'lucide-react';

interface ExamSubmissionsViewProps {
  submissions: ExamSubmission[];
  exams: Exam[];
  selectedExamId?: string;
  onReviewSubmission: (submission: ExamSubmission) => void;
}

export const ExamSubmissionsView: React.FC<ExamSubmissionsViewProps> = ({
  submissions,
  exams,
  selectedExamId,
  onReviewSubmission,
}) => {
  const [examFilter, setExamFilter] = useState<string>(selectedExamId || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = submissions.filter(sub => {
    if (examFilter !== 'all' && sub.examId !== examFilter) return false;
    if (searchTerm.trim()) {
      const match = (sub.studentName + ' ' + (sub.studentClass || '') + ' ' + sub.examTitle).toLowerCase();
      if (!match.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  // Calculate statistics
  const totalSubmissions = filtered.length;
  const avgScore =
    totalSubmissions > 0
      ? filtered.reduce((acc, s) => acc + s.totalScore, 0) / totalSubmissions
      : 0;
  const maxScore =
    totalSubmissions > 0 ? Math.max(...filtered.map(s => s.totalScore)) : 0;
  const passCount = filtered.filter(s => s.totalScore >= 5.0).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-800">Báo cáo & Thống kê Kết quả thi</h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Xem danh sách nộp bài của học sinh, thống kê điểm số và xem lại chi tiết bài làm.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs text-slate-500 font-semibold block mb-1">Lượt nộp bài</span>
            <span className="text-2xl font-black text-slate-800">{totalSubmissions}</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-xs text-emerald-700 font-semibold block mb-1">Điểm trung bình</span>
            <span className="text-2xl font-black text-emerald-700">{formatScore(avgScore)}</span>
          </div>

          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-center">
            <span className="text-xs text-teal-700 font-semibold block mb-1">Điểm cao nhất</span>
            <span className="text-2xl font-black text-teal-800">{formatScore(maxScore)}</span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
            <span className="text-xs text-blue-700 font-semibold block mb-1">Đạt yêu cầu (≥ 5.0)</span>
            <span className="text-2xl font-black text-blue-800">
              {totalSubmissions > 0 ? `${Math.round((passCount / totalSubmissions) * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên học sinh, lớp, đề thi..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
          >
            <option value="all">Tất cả đề thi ({exams.length})</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of submissions */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Chưa có lượt nộp bài nào theo tiêu chí tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4">Đề thi</th>
                  <th className="py-3 px-4 text-center">Thời gian làm</th>
                  <th className="py-3 px-4 text-center">Nộp bài lúc</th>
                  <th className="py-3 px-4 text-center">Điểm số</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{sub.studentName}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{sub.studentClass || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium max-w-xs truncate">{sub.examTitle}</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {Math.floor(sub.durationSeconds / 60)}p {sub.durationSeconds % 60}s
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {new Date(sub.submittedAt).toLocaleTimeString('vi-VN')} {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {formatScore(sub.totalScore)} / {formatScore(sub.maxScore)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onReviewSubmission(sub)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 font-semibold"
                        title="Xem bài thi"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem bài
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
