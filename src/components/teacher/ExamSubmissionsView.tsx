import React, { useState } from 'react';
import { ExamSubmission, Exam, QuestionGradingResult } from '../../types/index.ts';
import { formatScore, exportSubmissionsToCsv } from '../../services/scoring.ts';
import { saveSubmission } from '../../services/storage.ts';
import { ChemistryText } from '../ChemistryText.tsx';
import {
  Award,
  Users,
  Search,
  Filter,
  Eye,
  Calendar,
  Clock,
  BarChart3,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Save,
  X,
  Check,
} from 'lucide-react';

interface ExamSubmissionsViewProps {
  submissions: ExamSubmission[];
  exams: Exam[];
  selectedExamId?: string;
  onReviewSubmission: (submission: ExamSubmission) => void;
  onUpdateSubmission?: (submission: ExamSubmission) => void;
}

export const ExamSubmissionsView: React.FC<ExamSubmissionsViewProps> = ({
  submissions,
  exams,
  selectedExamId,
  onReviewSubmission,
  onUpdateSubmission,
}) => {
  const [examFilter, setExamFilter] = useState<string>(selectedExamId || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [localSubmissions, setLocalSubmissions] = useState<ExamSubmission[]>(submissions);

  // Manual Grading Modal state
  const [gradingSubmission, setGradingSubmission] = useState<ExamSubmission | null>(null);
  const [editedResults, setEditedResults] = useState<QuestionGradingResult[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync if props change
  React.useEffect(() => {
    setLocalSubmissions(submissions);
  }, [submissions]);

  const filtered = localSubmissions.filter(sub => {
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
  const pendingManualCount = filtered.filter(s =>
    s.questionResults?.some(r => r.status === 'pending_manual')
  ).length;

  const handleExport = () => {
    if (filtered.length === 0) {
      alert('Không có dữ liệu bài nộp nào để xuất.');
      return;
    }
    const examName =
      examFilter !== 'all'
        ? exams.find(e => e.id === examFilter)?.title || 'EduChem'
        : 'Tat_ca_de_thi';
    exportSubmissionsToCsv(filtered, examName);
  };

  const handleOpenGradingModal = (sub: ExamSubmission) => {
    setGradingSubmission(sub);
    setEditedResults(JSON.parse(JSON.stringify(sub.questionResults || [])));
    setSaveSuccessMsg(null);
  };

  const handleSaveGrading = () => {
    if (!gradingSubmission) return;

    // Recalculate total score
    const newTotalScore = editedResults.reduce((acc, r) => acc + (r.earnedPoints || 0), 0);
    const updatedSub: ExamSubmission = {
      ...gradingSubmission,
      questionResults: editedResults,
      totalScore: Math.round(newTotalScore * 100) / 100,
    };

    saveSubmission(updatedSub);

    // Update local state
    const updatedList = localSubmissions.map(s => (s.id === updatedSub.id ? updatedSub : s));
    setLocalSubmissions(updatedList);
    if (onUpdateSubmission) {
      onUpdateSubmission(updatedSub);
    }

    setSaveSuccessMsg('Đã lưu điểm và nhận xét thành công!');
    setTimeout(() => {
      setGradingSubmission(null);
      setSaveSuccessMsg(null);
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-800">Báo cáo & Thống kê Kết quả thi</h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Theo dõi lượt làm bài của học sinh, chấm điểm thủ công câu trả lời ngắn và xuất file Excel.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xuất kết quả (Excel/CSV)
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs text-slate-500 font-semibold block mb-1">Lượt nộp bài</span>
            <span className="text-2xl font-black text-slate-800">{totalSubmissions}</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-xs text-emerald-700 font-semibold block mb-1">Điểm trung bình</span>
            <span className="text-2xl font-black text-emerald-700">{formatScore(avgScore)}</span>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-center">
            <span className="text-xs text-teal-700 font-semibold block mb-1">Điểm cao nhất</span>
            <span className="text-2xl font-black text-teal-800">{formatScore(maxScore)}</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
            <span className="text-xs text-blue-700 font-semibold block mb-1">Đạt yêu cầu (≥ 5.0)</span>
            <span className="text-2xl font-black text-blue-800">
              {totalSubmissions > 0 ? `${Math.round((passCount / totalSubmissions) * 100)}%` : '0%'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-xs text-amber-700 font-semibold block mb-1">Chờ chấm thủ công</span>
            <span className="text-2xl font-black text-amber-800">{pendingManualCount}</span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên học sinh, lớp, đề thi..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white font-medium"
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
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
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
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(sub => {
                  const hasPending = sub.questionResults?.some(r => r.status === 'pending_manual');

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {sub.studentName}
                        {hasPending && (
                          <span className="block text-[10px] text-amber-600 font-semibold mt-0.5">
                            ⚠️ Có câu chờ chấm
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{sub.studentClass || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium max-w-xs truncate">{sub.examTitle}</td>
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {Math.floor(sub.durationSeconds / 60)}p {sub.durationSeconds % 60}s
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {new Date(sub.submittedAt).toLocaleTimeString('vi-VN')}{' '}
                        {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-extrabold text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          {formatScore(sub.totalScore)} / {formatScore(sub.maxScore)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenGradingModal(sub)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors inline-flex items-center gap-1 font-semibold text-xs border border-emerald-200"
                            title="Chấm điểm và ghi nhận xét"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {hasPending ? 'Chấm điểm' : 'Sửa điểm'}
                          </button>

                          <button
                            onClick={() => onReviewSubmission(sub)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 font-semibold text-xs"
                            title="Xem chi tiết bài thi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Xem
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Grading Dialog */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-600" />
                  Chấm điểm thủ công & Nhận xét bài thi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Học sinh: <strong>{gradingSubmission.studentName}</strong> • Lớp:{' '}
                  <strong>{gradingSubmission.studentClass || '—'}</strong> • Đề:{' '}
                  <strong>{gradingSubmission.examTitle}</strong>
                </p>
              </div>

              <button
                onClick={() => setGradingSubmission(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions to Grade */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {editedResults.map((result, idx) => {
                const isPending = result.status === 'pending_manual';

                return (
                  <div
                    key={result.questionId || idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isPending
                        ? 'bg-amber-50/50 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-xs text-slate-900">
                        Câu {idx + 1} ({result.type === 'short_answer' ? 'Trả lời ngắn' : result.type === 'true_false' ? 'Đúng/Sai' : 'Trắc nghiệm'})
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          result.status === 'correct'
                            ? 'bg-emerald-100 text-emerald-800'
                            : result.status === 'partially_correct'
                            ? 'bg-teal-100 text-teal-800'
                            : result.status === 'pending_manual'
                            ? 'bg-amber-200 text-amber-900 font-extrabold'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {result.status === 'pending_manual'
                          ? 'Chờ giáo viên chấm'
                          : result.status === 'correct'
                          ? 'Đúng hoàn toàn'
                          : result.status === 'partially_correct'
                          ? 'Đúng một phần'
                          : 'Chưa chính xác'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[10px] font-bold block mb-1 uppercase">
                          Câu trả lời của học sinh
                        </span>
                        <div className="font-mono font-bold text-slate-800">
                          {typeof result.studentAnswer === 'object'
                            ? JSON.stringify(result.studentAnswer)
                            : String(result.studentAnswer || '(Bỏ trống)')}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[10px] font-bold block mb-1 uppercase">
                          Đáp án chuẩn của đề
                        </span>
                        <div className="font-mono font-bold text-emerald-700">
                          {typeof result.correctAnswer === 'object'
                            ? JSON.stringify(result.correctAnswer)
                            : String(result.correctAnswer || '(Chưa cài đặt đáp án)')}
                        </div>
                      </div>
                    </div>

                    {/* Score assignment & feedback */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Điểm đạt được (Tối đa: {result.maxPoints}đ)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max={result.maxPoints}
                          value={result.earnedPoints}
                          onChange={(e) => {
                            const val = Math.min(
                              result.maxPoints,
                              Math.max(0, parseFloat(e.target.value) || 0)
                            );
                            const updated = [...editedResults];
                            updated[idx] = {
                              ...result,
                              earnedPoints: val,
                              status:
                                val === result.maxPoints
                                  ? 'correct'
                                  : val > 0
                                  ? 'partially_correct'
                                  : 'incorrect',
                            };
                            setEditedResults(updated);
                          }}
                          className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Lời phê / Nhận xét của giáo viên
                        </label>
                        <input
                          type="text"
                          value={result.teacherComment || ''}
                          onChange={(e) => {
                            const updated = [...editedResults];
                            updated[idx] = { ...result, teacherComment: e.target.value };
                            setEditedResults(updated);
                          }}
                          placeholder="Ví dụ: Đã đúng bản chất, lưu ý làm tròn kết quả..."
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer with Total Score */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs text-slate-500">Tổng điểm sau điều chỉnh:</span>
                <span className="ml-2 font-black text-base text-emerald-800">
                  {formatScore(
                    editedResults.reduce((acc, r) => acc + (r.earnedPoints || 0), 0)
                  )}{' '}
                  / {formatScore(gradingSubmission.maxScore)} điểm
                </span>
                {saveSuccessMsg && (
                  <span className="ml-3 text-xs text-emerald-600 font-bold inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {saveSuccessMsg}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveGrading}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Lưu kết quả chấm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
