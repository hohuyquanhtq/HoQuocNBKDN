import React, { useState, useEffect, useRef } from 'react';
import {
  Question,
  Exam,
  AutoExamCriteria,
  ScorePublishMode,
  QuestionType,
  DifficultyLevel,
} from '../../types/index.ts';
import {
  generateExamFromCriteria,
  generateUniqueExamCode,
  saveExam,
} from '../../services/storage.ts';
import { ChemistryText } from '../ChemistryText.tsx';
import QRCode from 'qrcode';
import {
  Zap,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  Share2,
  Clock,
  Layers,
  Shuffle,
  Eye,
  Sliders,
  ListPlus,
  AlertTriangle,
  ArrowRight,
  X,
  FileCheck2,
  HelpCircle,
  Calendar,
  Lock,
  Unlock,
  Check,
} from 'lucide-react';

interface QuickExamCreatorProps {
  questions: Question[];
  teacherId: string;
  onExamCreated: (exam: Exam) => void;
  onPreviewExam: (exam: Exam) => void;
  onNavigateToBank: () => void;
}

export const QuickExamCreator: React.FC<QuickExamCreatorProps> = ({
  questions,
  teacherId,
  onExamCreated,
  onPreviewExam,
  onNavigateToBank,
}) => {
  const [method, setMethod] = useState<'auto' | 'manual'>('auto');

  // Common Exam Info
  const [title, setTitle] = useState('Đề kiểm tra Hóa học 15 phút - Cân bằng hóa học');
  const [subject, setSubject] = useState('Hóa học');
  const [topic, setTopic] = useState('Cân bằng hóa học');
  const [targetGrade, setTargetGrade] = useState('Lớp 11');
  const [description, setDescription] = useState('Đề kiểm tra đánh giá năng lực theo cấu trúc chuẩn GDPT 2018.');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [totalPoints, setTotalPoints] = useState(10.0);

  // Policies
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [publishScoreMode, setPublishScoreMode] = useState<ScorePublishMode>('immediately');
  const [allowReviewAfterSubmit, setAllowReviewAfterSubmit] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Auto Criteria
  const [mcCount, setMcCount] = useState(4);
  const [tfCount, setTfCount] = useState(2);
  const [saCount, setSaCount] = useState(2);

  // Manual Selection
  const [manualSelectedIds, setManualSelectedIds] = useState<string[]>([]);
  const [manualSearch, setManualSearch] = useState('');
  const [manualTypeFilter, setManualTypeFilter] = useState('all');

  // Preview before publish
  const [stagedQuestions, setStagedQuestions] = useState<Question[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Success Modal with Link & QR
  const [publishedExam, setPublishedExam] = useState<Exam | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available bank counts
  const availableMC = questions.filter(q => q.type === 'multiple_choice');
  const availableTF = questions.filter(q => q.type === 'true_false');
  const availableSA = questions.filter(q => q.type === 'short_answer');

  // Generate QR Code when an exam is published
  useEffect(() => {
    if (publishedExam) {
      const shareUrl = `${window.location.origin}/?examCode=${publishedExam.code}`;
      QRCode.toDataURL(shareUrl, { width: 280, margin: 2, color: { dark: '#047857', light: '#ffffff' } })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Failed to generate QR code:', err));
    }
  }, [publishedExam]);

  // Handle Auto Create
  const handleAutoCreate = () => {
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên đề thi/bài kiểm tra.');
      return;
    }

    if (mcCount + tfCount + saCount === 0) {
      setErrorMessage('Tổng số câu hỏi phải lớn hơn 0.');
      return;
    }

    const criteria: AutoExamCriteria = {
      title: title.trim(),
      subject,
      topic,
      targetGrade,
      mcCount,
      tfCount,
      saCount,
      levelDistribution: { biet: 0, hieu: 0, vanDung: 0, vanDungCao: 0 },
      timeLimitMinutes,
      shuffleQuestions,
      shuffleOptions,
      publishScoreMode,
      allowReviewAfterSubmit,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    };

    const res = generateExamFromCriteria(criteria, questions, teacherId);
    if (!res.success || !res.exam) {
      setErrorMessage(res.error || 'Không thể tạo đề tự động theo điều kiện đã chọn.');
      return;
    }

    // Success! Show link & QR code
    onExamCreated(res.exam);
    setPublishedExam(res.exam);
  };

  // Handle Manual Create
  const handleManualCreate = () => {
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên đề thi/bài kiểm tra.');
      return;
    }

    if (manualSelectedIds.length === 0) {
      setErrorMessage('Vui lòng tích chọn ít nhất 1 câu hỏi từ danh sách.');
      return;
    }

    let selectedQuestions = questions.filter(q => manualSelectedIds.includes(q.id));

    if (shuffleQuestions) {
      selectedQuestions = [...selectedQuestions].sort(() => Math.random() - 0.5);
    }

    const examCode = generateUniqueExamCode();
    const newExam: Exam = {
      id: `exam-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code: examCode,
      title: title.trim(),
      subject,
      topic,
      targetGrade,
      description,
      timeLimitMinutes,
      totalPoints,
      questions: selectedQuestions,
      createdAt: new Date().toISOString(),
      createdBy: teacherId,
      isPublished: true,
      status: 'open',
      shuffleQuestions,
      shuffleOptions,
      publishScoreMode,
      allowReviewAfterSubmit,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      startedCount: 0,
      submittedCount: 0,
    };

    saveExam(newExam);
    onExamCreated(newExam);
    setPublishedExam(newExam);
  };

  const handleCopyLink = () => {
    if (!publishedExam) return;
    const shareUrl = `${window.location.origin}/?examCode=${publishedExam.code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!publishedExam) return;
    navigator.clipboard.writeText(publishedExam.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const filteredManualQuestions = questions.filter(q => {
    if (manualTypeFilter !== 'all' && q.type !== manualTypeFilter) return false;
    if (manualSearch.trim()) {
      const match = (q.stem + ' ' + (q.code || '')).toLowerCase();
      if (!match.includes(manualSearch.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-3 border border-white/10">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            Tạo đề nhanh & Chia sẻ link trực tuyến
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Tạo đề thi nhanh – Giao bài Online
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed max-w-2xl">
            Tự động lấy câu hỏi từ ngân hàng hoặc chọn thủ công. Phát sinh mã đề và link làm bài kèm mã QR để gửi qua Zalo, Messenger hoặc trình chiếu trên lớp cho học sinh quét vào thi ngay!
          </p>
        </div>
      </div>

      {/* Creation Method Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex">
        <button
          type="button"
          onClick={() => setMethod('auto')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            method === 'auto'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-4 h-4" />
          Cách 1: Tạo đề tự động theo điều kiện
        </button>
        <button
          type="button"
          onClick={() => setMethod('manual')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            method === 'manual'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ListPlus className="w-4 h-4" />
          Cách 2: Chọn câu hỏi thủ công ({manualSelectedIds.length} đã chọn)
        </button>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="w-4 h-4 text-emerald-600" />
          1. Thông tin chung & Cấu hình bài kiểm tra
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên đề thi / Bài kiểm tra <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Đề kiểm tra 15 phút Hóa học 11 - Cân bằng hóa học"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Môn học & Chủ đề</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Cân bằng hóa học"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lớp / Đối tượng học sinh</label>
            <input
              type="text"
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value)}
              placeholder="Lớp 11 hoặc Khối 11"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Thời gian làm bài (phút)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="180"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400 whitespace-nowrap">(0 = Không giới hạn)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Thang điểm tổng</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="100"
              value={totalPoints}
              onChange={(e) => setTotalPoints(parseFloat(e.target.value) || 10.0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Question picking based on Method */}
        {method === 'auto' ? (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                2. Thiết lập cơ cấu câu hỏi tự động (Ngân hàng hiện có {questions.length} câu)
              </h2>
              <button
                type="button"
                onClick={onNavigateToBank}
                className="text-xs text-emerald-700 font-semibold hover:underline"
              >
                + Thêm câu hỏi vào ngân hàng
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Multiple Choice */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-blue-900 uppercase">Trắc nghiệm 4 lựa chọn</span>
                  <span className="text-[11px] text-blue-700 font-semibold">
                    Kho: {availableMC.length} câu
                  </span>
                </div>
                <label className="block text-[11px] text-slate-600 mb-1">Số câu muốn lấy:</label>
                <input
                  type="number"
                  min="0"
                  max={availableMC.length}
                  value={mcCount}
                  onChange={(e) => setMcCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold text-blue-900 rounded-xl border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* True/False */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-purple-900 uppercase">Đúng / Sai 4 ý</span>
                  <span className="text-[11px] text-purple-700 font-semibold">
                    Kho: {availableTF.length} câu
                  </span>
                </div>
                <label className="block text-[11px] text-slate-600 mb-1">Số câu muốn lấy:</label>
                <input
                  type="number"
                  min="0"
                  max={availableTF.length}
                  value={tfCount}
                  onChange={(e) => setTfCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold text-purple-900 rounded-xl border border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Short Answer */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-amber-900 uppercase">Trả lời ngắn</span>
                  <span className="text-[11px] text-amber-700 font-semibold">
                    Kho: {availableSA.length} câu
                  </span>
                </div>
                <label className="block text-[11px] text-slate-600 mb-1">Số câu muốn lấy:</label>
                <input
                  type="number"
                  min="0"
                  max={availableSA.length}
                  value={saCount}
                  onChange={(e) => setSaCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold text-amber-900 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>
                Tổng số câu hỏi đề thi dự kiến: <strong>{mcCount + tfCount + saCount}</strong> câu
              </span>
              <span className="text-emerald-700 font-semibold">
                ✓ Hệ thống sẽ kiểm tra thực tế và lấy ngẫu nhiên theo điều kiện
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ListPlus className="w-4 h-4 text-emerald-600" />
                2. Chọn câu hỏi thủ công (Đã chọn {manualSelectedIds.length}/{questions.length} câu)
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setManualSelectedIds(questions.map(q => q.id))}
                  className="text-xs text-emerald-700 font-semibold hover:underline"
                >
                  Chọn tất cả
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setManualSelectedIds([])}
                  className="text-xs text-rose-600 font-semibold hover:underline"
                >
                  Bỏ chọn hết
                </button>
              </div>
            </div>

            {/* Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                placeholder="Tìm nội dung, mã câu hỏi..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
              />
              <select
                value={manualTypeFilter}
                onChange={(e) => setManualTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
              >
                <option value="all">Tất cả loại câu</option>
                <option value="multiple_choice">Trắc nghiệm</option>
                <option value="true_false">Đúng / Sai</option>
                <option value="short_answer">Trả lời ngắn</option>
              </select>
            </div>

            {/* Questions list */}
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
              {filteredManualQuestions.map((q, idx) => {
                const isSelected = manualSelectedIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setManualSelectedIds(prev =>
                        prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                      );
                    }}
                    className={`p-3.5 text-xs flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800">{q.code || `Câu ${idx + 1}`}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-medium">
                          {q.type === 'multiple_choice' ? 'Trắc nghiệm' : q.type === 'true_false' ? 'Đúng/Sai' : 'Trả lời ngắn'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">[{q.level || 'BIẾT'}]</span>
                      </div>
                      <p className="line-clamp-2 text-slate-700 font-normal">{q.stem}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 3: Anticheat & Exam Policies */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-emerald-600" />
            3. Xáo trộn & Quy định công bố kết quả
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Shuffling */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">Quy định xáo trộn đề thi:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 font-medium">Xáo trộn thứ tự các câu hỏi trong đề</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 font-medium">Xáo trộn thứ tự các phương án A, B, C, D</span>
              </label>
            </div>

            {/* Result disclosure */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">Chế độ hiển thị điểm & Lời giải:</span>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Thời điểm công bố điểm:</label>
                <select
                  value={publishScoreMode}
                  onChange={(e) => setPublishScoreMode(e.target.value as ScorePublishMode)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 bg-white"
                >
                  <option value="immediately">Hiện điểm ngay sau khi nộp bài</option>
                  <option value="after_teacher_release">Chỉ hiện điểm sau khi giáo viên công bố</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={allowReviewAfterSubmit}
                  onChange={(e) => setAllowReviewAfterSubmit(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 font-medium">Cho phép học sinh xem đáp án và hướng dẫn giải sau khi nộp</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Hệ thống sẽ lưu đề thi lên máy chủ và tạo link chia sẻ có thể mở trên mọi thiết bị.
          </p>

          <button
            type="button"
            onClick={method === 'auto' ? handleAutoCreate : handleManualCreate}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2.5"
          >
            <Zap className="w-4 h-4 fill-white" />
            TẠO ĐỀ VÀ LẤY LINK LÀM BÀI
          </button>
        </div>
      </div>

      {/* SUCCESS MODAL: SHARE LINK & QR CODE */}
      {publishedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white text-center relative shrink-0">
              <button
                type="button"
                onClick={() => setPublishedExam(null)}
                className="absolute right-4 top-4 text-emerald-100 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-2 text-white shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Đã tạo đề thi thành công!</h2>
              <p className="text-xs text-emerald-100 mt-1">
                Mã đề và đường dẫn làm bài trực tuyến đã sẵn sàng để gửi cho học sinh
              </p>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Exam Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Tên bài thi:</span>
                  <strong className="text-xs text-slate-900">{publishedExam.title}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Mã đề duy nhất:</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-black text-sm border border-emerald-300">
                      {publishedExam.code}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-1 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Sao chép mã đề"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Số câu: <strong>{publishedExam.questions.length}</strong></span>
                  <span>Thời gian: <strong>{publishedExam.timeLimitMinutes > 0 ? `${publishedExam.timeLimitMinutes} phút` : 'Không giới hạn'}</strong></span>
                  <span>Trạng thái: <strong className="text-emerald-700">Đang mở nhận bài</strong></span>
                </div>
              </div>

              {/* Share Link Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  Đường dẫn làm bài trực tuyến (Gửi cho học sinh):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/?examCode=${publishedExam.code}`}
                    className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50 text-slate-800 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0 ${
                      copiedLink
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? 'ĐÃ SAO CHÉP!' : 'SAO CHÉP LINK LÀM BÀI'}
                  </button>
                </div>
              </div>

              {/* QR Code Presentation */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center">
                <span className="text-xs font-bold text-emerald-900 block mb-2">
                  Mã QR làm bài (Trình chiếu trên lớp hoặc in vào phiếu đề)
                </span>
                {qrCodeUrl ? (
                  <div className="inline-block p-3 rounded-2xl bg-white border border-emerald-200 shadow-sm">
                    <img src={qrCodeUrl} alt="QR Code đề thi" className="w-48 h-48 mx-auto" />
                  </div>
                ) : (
                  <div className="w-48 h-48 mx-auto flex items-center justify-center text-xs text-slate-400">
                    Đang tạo mã QR...
                  </div>
                )}
                <p className="text-[11px] text-emerald-700 mt-2">
                  Học sinh mở camera điện thoại hoặc Zalo quét mã QR để làm bài trực tiếp không cần cài app.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onPreviewExam(publishedExam);
                    setPublishedExam(null);
                  }}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  XEM THỬ ĐỀ THI
                </button>

                <button
                  type="button"
                  onClick={() => setPublishedExam(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Hoàn tất & Về danh sách đề
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
