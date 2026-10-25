import React, { useState, useRef } from 'react';
import {
  Question,
  Exam,
  QuestionType,
  DifficultyLevel,
  ScorePublishMode,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
} from '../../types/index.ts';
import { parseDocxFile } from '../../services/docxParser.ts';
import { downloadSampleDocx } from '../../services/docxGenerator.ts';
import { generateUniqueExamCode, saveExamAsync } from '../../services/storage.ts';
import { ChemistryText } from '../ChemistryText.tsx';
import QRCode from 'qrcode';
import {
  Upload,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  Save,
  Plus,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Clock,
  Shuffle,
  Eye,
  Sliders,
  Download,
  FileSpreadsheet,
  Zap,
  ArrowRight,
  HelpCircle,
  X,
  FileWarning,
  RefreshCw,
} from 'lucide-react';

interface WordExamCreatorProps {
  teacherId: string;
  onExamCreated: (exam: Exam) => void;
  onPreviewExam: (exam: Exam) => void;
  onNavigateToExams: () => void;
}

export const WordExamCreator: React.FC<WordExamCreatorProps> = ({
  teacherId,
  onExamCreated,
  onPreviewExam,
  onNavigateToExams,
}) => {
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [rawText, setRawText] = useState<string>('');
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  // Filter & Editing State
  const [activeFilter, setActiveFilter] = useState<'all' | 'needs_check' | 'mc' | 'tf' | 'sa'>('all');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);

  // Exam Configuration
  const [examTitle, setExamTitle] = useState('Đề kiểm tra Hóa học từ file Word');
  const [targetGrade, setTargetGrade] = useState('Lớp 11');
  const [topic, setTopic] = useState('Chung');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(45);
  const [isUnlimitedTime, setIsUnlimitedTime] = useState(false);
  const [totalPoints, setTotalPoints] = useState(10.0);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [requireStudentInfo, setRequireStudentInfo] = useState(true);
  const [publishScoreMode, setPublishScoreMode] = useState<ScorePublishMode>('immediately');
  const [allowReviewAfterSubmit, setAllowReviewAfterSubmit] = useState(true);

  // Success Modal
  const [publishedExam, setPublishedExam] = useState<Exam | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const validateAndSetFile = (f: File) => {
    setFileError(null);
    const fileName = f.name.toLowerCase();

    if (fileName.endsWith('.doc') && !fileName.endsWith('.docx')) {
      setFileError(
        'Hệ thống hiện tại tối ưu hóa phân tích file Word định dạng .docx. Vui lòng mở file bằng Microsoft Word hoặc Google Docs, chọn "Save As" / "Lưu dưới dạng" .docx rồi tải lại.'
      );
      return;
    }

    if (!fileName.endsWith('.docx')) {
      setFileError('Chỉ hỗ trợ file Word định dạng .docx. Vui lòng chọn đúng file.');
      return;
    }

    if (f.size > 30 * 1024 * 1024) {
      setFileError('Kích thước file vượt quá giới hạn cho phép (tối đa 30MB).');
      return;
    }

    setFile(f);
    // Use file name (without extension) as default exam title
    const nameWithoutExt = f.name.replace(/\.[^/.]+$/, '').trim();
    if (nameWithoutExt) {
      setExamTitle(nameWithoutExt);
    }
  };

  // Perform Analysis
  const handleParseDocx = async () => {
    if (!file) return;
    setIsParsing(true);
    setFileError(null);
    setParseWarnings([]);

    try {
      const result = await parseDocxFile(file);
      setQuestions(result.questions);
      setRawText(result.rawText);
      setParseWarnings(result.warnings);
      setHasParsed(true);
    } catch (err) {
      console.error('Lỗi phân tích file Word:', err);
      setFileError(
        'Đã xảy ra lỗi trong quá trình đọc file Word. Hãy đảm bảo file không bị lỗi mã hóa hoặc đặt mật khẩu bảo vệ.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  // Reset file selection
  const handleClearFile = () => {
    setFile(null);
    setQuestions([]);
    setRawText('');
    setParseWarnings([]);
    setHasParsed(false);
    setEditingIndex(null);
    setEditedQuestion(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Question editing helpers
  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditedQuestion(JSON.parse(JSON.stringify(questions[index])));
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editedQuestion) return;
    const updated = [...questions];
    updated[editingIndex] = editedQuestion;
    setQuestions(updated);
    setEditingIndex(null);
    setEditedQuestion(null);
  };

  const handleDeleteQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditedQuestion(null);
    }
  };

  const handleAddNewQuestion = (type: QuestionType) => {
    const newQ: Question =
      type === 'multiple_choice'
        ? {
            id: `q-manual-${Date.now()}`,
            code: `CH-TN-${questions.length + 1}`,
            type: 'multiple_choice',
            level: 'HIỂU',
            stem: 'Nội dung câu hỏi trắc nghiệm mới...',
            options: [
              { id: 'A', text: 'Phương án A' },
              { id: 'B', text: 'Phương án B' },
              { id: 'C', text: 'Phương án C' },
              { id: 'D', text: 'Phương án D' },
            ],
            correctAnswer: 'A',
            createdAt: new Date().toISOString(),
          }
        : type === 'true_false'
        ? {
            id: `q-manual-${Date.now()}`,
            code: `CH-DS-${questions.length + 1}`,
            type: 'true_false',
            level: 'VẬN DỤNG',
            stem: 'Nội dung câu hỏi Đúng/Sai mới...',
            statements: [
              { id: 'a', text: 'Mệnh đề a', correctAnswer: true },
              { id: 'b', text: 'Mệnh đề b', correctAnswer: false },
              { id: 'c', text: 'Mệnh đề c', correctAnswer: true },
              { id: 'd', text: 'Mệnh đề d', correctAnswer: false },
            ],
            createdAt: new Date().toISOString(),
          }
        : {
            id: `q-manual-${Date.now()}`,
            code: `CH-TLN-${questions.length + 1}`,
            type: 'short_answer',
            level: 'VẬN DỤNG CAO',
            stem: 'Nội dung câu hỏi trả lời ngắn mới...',
            correctAnswer: '0',
            acceptableAnswers: ['0'],
            createdAt: new Date().toISOString(),
          };

    setQuestions([...questions, newQ]);
    setEditingIndex(questions.length);
    setEditedQuestion(JSON.parse(JSON.stringify(newQ)));
  };

  const handleTypeChange = (newType: QuestionType) => {
    if (!editedQuestion) return;
    if (editedQuestion.type === newType) return;

    if (newType === 'multiple_choice') {
      setEditedQuestion({
        ...editedQuestion,
        type: 'multiple_choice',
        options: [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' },
        ],
        correctAnswer: 'A',
      });
    } else if (newType === 'true_false') {
      setEditedQuestion({
        ...editedQuestion,
        type: 'true_false',
        statements: [
          { id: 'a', text: '', correctAnswer: true },
          { id: 'b', text: '', correctAnswer: false },
          { id: 'c', text: '', correctAnswer: true },
          { id: 'd', text: '', correctAnswer: false },
        ],
      });
    } else {
      setEditedQuestion({
        ...editedQuestion,
        type: 'short_answer',
        correctAnswer: '',
        acceptableAnswers: [],
        tolerance: 0,
      });
    }
  };

  // Helper check if question has complete answer
  const isQuestionAnswerComplete = (q: Question): boolean => {
    if (q.type === 'multiple_choice') {
      return Boolean(q.correctAnswer && q.correctAnswer.trim());
    }
    if (q.type === 'true_false') {
      return Array.isArray(q.statements) && q.statements.length > 0;
    }
    if (q.type === 'short_answer') {
      return Boolean(q.correctAnswer && q.correctAnswer.trim());
    }
    return false;
  };

  const needsCheck = (q: Question): boolean => {
    if (!isQuestionAnswerComplete(q)) return true;
    if (q.warnings && q.warnings.length > 0) return true;
    if (q.type === 'multiple_choice' && (!q.options || q.options.length < 2)) return true;
    if (q.type === 'true_false' && (!q.statements || q.statements.length < 2)) return true;
    return false;
  };

  // Statistics calculation
  const totalCount = questions.length;
  const mcCount = questions.filter(q => q.type === 'multiple_choice').length;
  const tfCount = questions.filter(q => q.type === 'true_false').length;
  const saCount = questions.filter(q => q.type === 'short_answer').length;
  const withAnswerCount = questions.filter(isQuestionAnswerComplete).length;
  const withoutAnswerCount = totalCount - withAnswerCount;
  const needsCheckCount = questions.filter(needsCheck).length;

  // Filtered list
  const filteredQuestions = questions.filter((q, idx) => {
    if (activeFilter === 'needs_check') return needsCheck(q);
    if (activeFilter === 'mc') return q.type === 'multiple_choice';
    if (activeFilter === 'tf') return q.type === 'true_false';
    if (activeFilter === 'sa') return q.type === 'short_answer';
    return true;
  });

  // Action: Create and Publish Exam directly
  const handlePublishExam = async () => {
    if (questions.length === 0) {
      alert('Chưa có câu hỏi nào để tạo đề thi. Vui lòng tải và phân tích file Word trước.');
      return;
    }

    if (!examTitle.trim()) {
      alert('Vui lòng nhập tên đề thi.');
      return;
    }

    // Check if there are questions without answers
    if (withoutAnswerCount > 0) {
      const proceed = confirm(
        `Cảnh báo: Hiện có ${withoutAnswerCount} câu hỏi chưa có đáp án chính thức.\nKhi học sinh nộp bài, các câu này sẽ hiển thị ở trạng thái "Chờ giáo viên chấm thủ công".\n\nBạn có chắc chắn muốn phát hành đề thi ngay bây giờ?`
      );
      if (!proceed) return;
    }

    const examCode = generateUniqueExamCode();
    const newExam: Exam = {
      id: `exam-word-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: examCode,
      title: examTitle.trim(),
      subject: 'Hóa học',
      topic: topic.trim() || undefined,
      targetGrade: targetGrade || undefined,
      timeLimitMinutes: isUnlimitedTime ? 0 : timeLimitMinutes,
      totalPoints: totalPoints || 10.0,
      questions: questions,
      createdAt: new Date().toISOString(),
      createdBy: teacherId,
      isPublished: true,
      status: 'open',
      shuffleQuestions: shuffleQuestions,
      shuffleOptions: shuffleOptions,
      publishScoreMode: publishScoreMode,
      allowReviewAfterSubmit: allowReviewAfterSubmit,
      startedCount: 0,
      submittedCount: 0,
    };

    setIsPublishing(true);
    try {
      const res = await saveExamAsync(newExam);
      if (!res.success) {
        alert(res.error || 'Không thể lưu đề thi lên hệ thống dùng chung. Vui lòng kiểm tra lại kết nối.');
        return;
      }

      const verifiedExam = res.exam;
      onExamCreated(verifiedExam);
      setPublishedExam(verifiedExam);

      // Generate QR Code
      const shareUrl = `${window.location.origin}/?examCode=${verifiedExam.code}`;
      try {
        const qrData = await QRCode.toDataURL(shareUrl, {
          width: 300,
          margin: 2,
          color: { dark: '#047857', light: '#ffffff' },
        });
        setQrCodeUrl(qrData);
      } catch (err) {
        console.error('QR code generation error:', err);
      }
    } catch (err) {
      console.error('Publish error:', err);
      alert('Đã xảy ra lỗi khi phát hành đề thi.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyShareLink = () => {
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-3 border border-white/20">
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            TÍNH NĂNG NỔI BẬT: WORD-TO-EXAM
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Tạo đề online nhanh từ file Word (.docx)
          </h1>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            Tải lên đề thi Word có sẵn (hỗ trợ cả 3 dạng: Trắc nghiệm 4 lựa chọn, Đúng/Sai 4 ý, Trả lời ngắn).
            Hệ thống tự động phân tích câu hỏi, nhận diện đáp án, cho phép xem trước, chỉnh sửa và tạo link làm bài trực tiếp cho học sinh ngay lập tức!
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={downloadSampleDocx}
              className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 backdrop-blur-md"
            >
              <Download className="w-3.5 h-3.5" />
              Tải file Word mẫu chuẩn GDPT 2018
            </button>
          </div>
        </div>
      </div>

      {/* Step 1: File Upload & Analysis */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
              1
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-800">Tải file Word (.docx) & Phân tích</h2>
              <p className="text-xs text-slate-500">Kéo thả file đề thi hoặc chọn từ máy tính</p>
            </div>
          </div>
          {file && (
            <button
              onClick={handleClearFile}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Chọn file khác
            </button>
          )}
        </div>

        {/* Upload Zone */}
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
                : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-xs">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">
              Kéo thả file <span className="text-emerald-700">.docx</span> vào đây hoặc click để chọn file
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hỗ trợ tự động nhận diện cả 3 phần: Trắc nghiệm 4 lựa chọn, Đúng/Sai 4 ý, Trả lời ngắn, công thức hóa học, bảng biểu và đáp án cuối file.
            </p>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{file.name}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">Định dạng Word .docx</span>
                  {hasParsed && (
                    <>
                      <span>•</span>
                      <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        Đã phân tích: {questions.length} câu
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleParseDocx}
                disabled={isParsing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang phân tích câu hỏi...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current text-amber-300" />
                    PHÂN TÍCH FILE WORD
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* File Error Notice */}
        {fileError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
            <FileWarning className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-bold mb-0.5">Thông báo định dạng file:</p>
              <p>{fileError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Dashboard Statistics & Question Inspection */}
      {hasParsed && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                2
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Phần A: Bảng thống kê sơ bộ & Kiểm tra câu hỏi
                </h2>
                <p className="text-xs text-slate-500">
                  Xem số lượng câu hỏi nhận diện được theo dạng và tính đầy đủ của đáp án
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddNewQuestion('multiple_choice')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm câu hỏi
              </button>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div
              onClick={() => setActiveFilter('all')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeFilter === 'all'
                  ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs text-slate-500 font-semibold block mb-1">Tổng số câu</span>
              <span className="text-2xl font-black text-slate-900">{totalCount}</span>
              <span className="text-[10px] text-slate-400 block mt-1">câu hỏi nhận diện</span>
            </div>

            <div
              onClick={() => setActiveFilter('mc')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeFilter === 'mc'
                  ? 'bg-blue-50 border-blue-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs text-blue-700 font-semibold block mb-1">Dạng 1: Nhiều lựa chọn</span>
              <span className="text-2xl font-black text-blue-900">{mcCount}</span>
              <span className="text-[10px] text-blue-500 block mt-1">4 phương án A, B, C, D</span>
            </div>

            <div
              onClick={() => setActiveFilter('tf')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeFilter === 'tf'
                  ? 'bg-purple-50 border-purple-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs text-purple-700 font-semibold block mb-1">Dạng 2: Đúng / Sai</span>
              <span className="text-2xl font-black text-purple-900">{tfCount}</span>
              <span className="text-[10px] text-purple-500 block mt-1">4 mệnh đề a, b, c, d</span>
            </div>

            <div
              onClick={() => setActiveFilter('sa')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeFilter === 'sa'
                  ? 'bg-amber-50 border-amber-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs text-amber-700 font-semibold block mb-1">Dạng 3: Trả lời ngắn</span>
              <span className="text-2xl font-black text-amber-900">{saCount}</span>
              <span className="text-[10px] text-amber-500 block mt-1">điền số / từ ngắn</span>
            </div>

            <div
              onClick={() => setActiveFilter('needs_check')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeFilter === 'needs_check'
                  ? 'bg-rose-50 border-rose-500 shadow-xs'
                  : needsCheckCount > 0
                  ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-100/50'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-xs text-rose-700 font-bold block mb-1 flex items-center gap-1">
                {needsCheckCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                Cần kiểm tra
              </span>
              <span className="text-2xl font-black text-rose-700">{needsCheckCount}</span>
              <span className="text-[10px] text-rose-500 block mt-1">thiếu đáp án hoặc cảnh báo</span>
            </div>
          </div>

          {/* Warnings Banner if any */}
          {parseWarnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Lưu ý trong quá trình phân tích file:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800/90 pl-1">
                {parseWarnings.slice(0, 5).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
                {parseWarnings.length > 5 && (
                  <li>... và {parseWarnings.length - 5} cảnh báo khác cần rà soát</li>
                )}
              </ul>
            </div>
          )}

          {/* Section B: Questions List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                Phần B: Danh sách câu hỏi chi tiết ({filteredQuestions.length}/{totalCount})
              </h3>
              <span className="text-xs text-slate-500">
                Nhấn vào &quot;Chỉnh sửa&quot; để bổ sung đáp án hoặc thay đổi nội dung
              </span>
            </div>

            <div className="space-y-4">
              {filteredQuestions.map((q, qIndex) => {
                const originalIndex = questions.findIndex(item => item.id === q.id);
                const isEditing = editingIndex === originalIndex;
                const complete = isQuestionAnswerComplete(q);
                const flagCheck = needsCheck(q);

                if (isEditing && editedQuestion) {
                  return (
                    <div
                      key={q.id}
                      className="bg-emerald-50/40 border-2 border-emerald-400 rounded-2xl p-5 shadow-sm space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-emerald-900 text-sm">
                            Đang sửa: Câu {originalIndex + 1}
                          </span>
                          <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold">
                            {q.code || `CH-${originalIndex + 1}`}
                          </span>
                        </div>

                        {/* Switch Type */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-200 text-xs">
                          <button
                            onClick={() => handleTypeChange('multiple_choice')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                              editedQuestion.type === 'multiple_choice'
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            Nhiều lựa chọn
                          </button>
                          <button
                            onClick={() => handleTypeChange('true_false')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                              editedQuestion.type === 'true_false'
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            Đúng / Sai
                          </button>
                          <button
                            onClick={() => handleTypeChange('short_answer')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                              editedQuestion.type === 'short_answer'
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            Trả lời ngắn
                          </button>
                        </div>
                      </div>

                      {/* Level & Stem */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-1">
                          <label className="text-xs font-bold text-slate-700 block mb-1">Mức độ nhận thức</label>
                          <select
                            value={editedQuestion.level || 'HIỂU'}
                            onChange={(e) =>
                              setEditedQuestion({
                                ...editedQuestion,
                                level: e.target.value as DifficultyLevel,
                              })
                            }
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="BIẾT">NHẬN BIẾT (BIẾT)</option>
                            <option value="HIỂU">THÔNG HIỂU (HIỂU)</option>
                            <option value="VẬN DỤNG">VẬN DỤNG</option>
                            <option value="VẬN DỤNG CAO">VẬN DỤNG CAO</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-xs font-bold text-slate-700 block mb-1">Nội dung câu hỏi (Stem)</label>
                          <textarea
                            rows={3}
                            value={editedQuestion.stem}
                            onChange={(e) =>
                              setEditedQuestion({ ...editedQuestion, stem: e.target.value })
                            }
                            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:outline-none"
                            placeholder="Nhập nội dung câu hỏi..."
                          />
                        </div>
                      </div>

                      {/* Multiple Choice Editor */}
                      {editedQuestion.type === 'multiple_choice' && (
                        <div className="space-y-2 pt-2">
                          <label className="text-xs font-bold text-slate-700 block">
                            Các phương án lựa chọn (Click nút tròn để chọn đáp án đúng):
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(editedQuestion as MultipleChoiceQuestion).options.map((opt, oIdx) => {
                              const isCorrect = (editedQuestion as MultipleChoiceQuestion).correctAnswer === opt.id;
                              return (
                                <div
                                  key={opt.id}
                                  className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                    isCorrect
                                      ? 'bg-emerald-100/60 border-emerald-500'
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditedQuestion({
                                        ...editedQuestion,
                                        correctAnswer: opt.id,
                                      })
                                    }
                                    className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 text-slate-700 hover:bg-emerald-200'
                                    }`}
                                  >
                                    {opt.id}
                                  </button>
                                  <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => {
                                      const newOpts = [...(editedQuestion as MultipleChoiceQuestion).options];
                                      newOpts[oIdx] = { ...newOpts[oIdx], text: e.target.value };
                                      setEditedQuestion({
                                        ...editedQuestion,
                                        options: newOpts,
                                      });
                                    }}
                                    className="flex-1 text-xs bg-transparent border-none focus:outline-none"
                                    placeholder={`Phương án ${opt.id}...`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* True / False Editor */}
                      {editedQuestion.type === 'true_false' && (
                        <div className="space-y-2 pt-2">
                          <label className="text-xs font-bold text-slate-700 block">
                            4 Mệnh đề Đúng / Sai (Chọn Đúng hoặc Sai cho từng ý):
                          </label>
                          <div className="space-y-2">
                            {(editedQuestion as TrueFalseQuestion).statements.map((stmt, sIdx) => (
                              <div
                                key={stmt.id}
                                className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200"
                              >
                                <span className="font-bold text-xs text-purple-700 w-6 shrink-0">
                                  {stmt.id})
                                </span>
                                <input
                                  type="text"
                                  value={stmt.text}
                                  onChange={(e) => {
                                    const newStmts = [...(editedQuestion as TrueFalseQuestion).statements];
                                    newStmts[sIdx] = { ...newStmts[sIdx], text: e.target.value };
                                    setEditedQuestion({
                                      ...editedQuestion,
                                      statements: newStmts,
                                    });
                                  }}
                                  className="flex-1 text-xs focus:outline-none"
                                  placeholder={`Mệnh đề ${stmt.id}...`}
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newStmts = [...(editedQuestion as TrueFalseQuestion).statements];
                                      newStmts[sIdx] = { ...newStmts[sIdx], correctAnswer: true };
                                      setEditedQuestion({
                                        ...editedQuestion,
                                        statements: newStmts,
                                      });
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                      stmt.correctAnswer === true
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    Đúng
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newStmts = [...(editedQuestion as TrueFalseQuestion).statements];
                                      newStmts[sIdx] = { ...newStmts[sIdx], correctAnswer: false };
                                      setEditedQuestion({
                                        ...editedQuestion,
                                        statements: newStmts,
                                      });
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                      stmt.correctAnswer === false
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    Sai
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Short Answer Editor */}
                      {editedQuestion.type === 'short_answer' && (
                        <div className="space-y-3 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1">
                                Đáp án chính thức
                              </label>
                              <input
                                type="text"
                                value={(editedQuestion as ShortAnswerQuestion).correctAnswer}
                                onChange={(e) =>
                                  setEditedQuestion({
                                    ...editedQuestion,
                                    correctAnswer: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:outline-none"
                                placeholder="Ví dụ: 33 hoặc 0,05 hoặc Fe2O3"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1">
                                Các biến thể chấp nhận (phân cách bởi dấu phẩy)
                              </label>
                              <input
                                type="text"
                                value={((editedQuestion as ShortAnswerQuestion).acceptableAnswers || []).join(', ')}
                                onChange={(e) =>
                                  setEditedQuestion({
                                    ...editedQuestion,
                                    acceptableAnswers: e.target.value
                                      .split(',')
                                      .map(s => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:outline-none"
                                placeholder="Ví dụ: 33%, 33.3, 33,3"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Hướng dẫn giải chi tiết (Hiển thị cho học sinh sau khi nộp bài)
                        </label>
                        <textarea
                          rows={2}
                          value={editedQuestion.explanation || ''}
                          onChange={(e) =>
                            setEditedQuestion({
                              ...editedQuestion,
                              explanation: e.target.value,
                            })
                          }
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:outline-none"
                          placeholder="Nhập lời giải hoặc cơ sở lý thuyết..."
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIndex(null);
                            setEditedQuestion(null);
                          }}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Lưu thay đổi
                        </button>
                      </div>
                    </div>
                  );
                }

                // View Mode for Question Card
                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:border-slate-300 ${
                      flagCheck ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          Câu {originalIndex + 1}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {q.type === 'multiple_choice'
                            ? 'Dạng 1: Nhiều lựa chọn'
                            : q.type === 'true_false'
                            ? 'Dạng 2: Đúng / Sai'
                            : 'Dạng 3: Trả lời ngắn'}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {q.level || 'THÔNG HIỂU'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {flagCheck && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            CẦN GIÁO VIÊN KIỂM TRA
                          </span>
                        )}
                        {complete && !flagCheck && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Đủ đáp án
                          </span>
                        )}

                        <button
                          onClick={() => handleStartEdit(originalIndex)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Sửa câu hỏi này"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(originalIndex)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa câu hỏi này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stem Content */}
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium mb-3">
                      <ChemistryText text={q.stem} />
                    </div>

                    {/* Options or Statements preview */}
                    {q.type === 'multiple_choice' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
                        {q.options.map(opt => {
                          const isKey = q.correctAnswer === opt.id;
                          return (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-xl flex items-center gap-2 border ${
                                isKey
                                  ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                  isKey ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {opt.id}
                              </span>
                              <div className="truncate">
                                <ChemistryText text={opt.text} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="space-y-1.5 text-xs mb-2">
                        {q.statements.map(stmt => (
                          <div
                            key={stmt.id}
                            className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-purple-700">{stmt.id})</span>
                              <span className="text-slate-800">
                                <ChemistryText text={stmt.text} />
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                stmt.correctAnswer === true
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : stmt.correctAnswer === false
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {stmt.correctAnswer === true
                                ? 'ĐÚNG'
                                : stmt.correctAnswer === false
                                ? 'SAI'
                                : 'Chưa chọn'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'short_answer' && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs flex items-center gap-2 mb-2">
                        <span className="font-bold text-amber-900">Đáp án chính thức:</span>
                        <span className="font-extrabold text-emerald-700 text-sm bg-white px-2 py-0.5 rounded-md border border-amber-300">
                          {q.correctAnswer || (
                            <span className="text-rose-600 italic">Chưa nhận diện</span>
                          )}
                        </span>
                        {q.acceptableAnswers && q.acceptableAnswers.length > 0 && (
                          <span className="text-[11px] text-slate-500">
                            (Chấp nhận: {q.acceptableAnswers.join(', ')})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Explanation if present */}
                    {q.explanation && (
                      <div className="mt-2 p-2 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-200">
                        <span className="font-bold text-slate-700">Lời giải: </span>
                        <ChemistryText text={q.explanation} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Exam Configuration & Link Generation */}
      {hasParsed && questions.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
              3
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Cấu hình đề thi & Phát hành link làm bài
              </h2>
              <p className="text-xs text-slate-500">
                Thiết lập thời gian, điểm số và chính sách làm bài cho học sinh
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Info */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tên đề thi / Bài kiểm tra <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-semibold text-slate-900"
                  placeholder="Ví dụ: Đề khảo sát Hóa học 11 - Chương 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Khối lớp</label>
                  <select
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Lớp 10">Lớp 10</option>
                    <option value="Lớp 11">Lớp 11</option>
                    <option value="Lớp 12">Lớp 12</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Chủ đề / Chuyên đề</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
                    placeholder="Ví dụ: Cân bằng hóa học"
                  />
                </div>
              </div>

              {/* Time & Points */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Thời gian làm bài</label>
                    <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUnlimitedTime}
                        onChange={(e) => setIsUnlimitedTime(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Không giới hạn
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={180}
                      disabled={isUnlimitedTime}
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 15)}
                      className="w-full pl-3 pr-10 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">phút</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Thang điểm tổng</label>
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
            </div>

            {/* Policies */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                Chính sách thi & Hiển thị
              </h3>

              <div className="space-y-3 text-xs">
                {/* Shuffle Questions */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">Xáo trộn thứ tự câu hỏi</span>
                    <span className="text-[11px] text-slate-500">Mỗi học sinh nhận đề với thứ tự câu khác nhau</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </label>

                {/* Shuffle Options */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">Xáo trộn phương án trắc nghiệm</span>
                    <span className="text-[11px] text-slate-500">Đảo ngẫu nhiên A, B, C, D cho câu hỏi Dạng 1</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </label>

                {/* Publish Score Mode */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-800 block">Chế độ công bố điểm</span>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPublishScoreMode('immediately')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border ${
                        publishScoreMode === 'immediately'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Hiện điểm ngay sau nộp
                    </button>
                    <button
                      type="button"
                      onClick={() => setPublishScoreMode('after_teacher_release')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border ${
                        publishScoreMode === 'after_teacher_release'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Chỉ hiện khi GV công bố
                    </button>
                  </div>
                </div>

                {/* Allow Review */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">Xem đáp án & hướng dẫn giải</span>
                    <span className="text-[11px] text-slate-500">Học sinh được xem bài làm đúng/sai sau khi nộp</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowReviewAfterSubmit}
                    onChange={(e) => setAllowReviewAfterSubmit(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Action Button: Create and Get Link */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              Tổng số câu trong đề:{' '}
              <span className="font-bold text-emerald-800">{questions.length} câu</span>{' '}
              ({mcCount} trắc nghiệm • {tfCount} đúng/sai • {saCount} trả lời ngắn)
            </div>

            <button
              onClick={handlePublishExam}
              disabled={isPublishing}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  ĐANG LƯU VÀO DATABASE DÙNG CHUNG...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-amber-300" />
                  TẠO ĐỀ VÀ LẤY LINK LÀM BÀI
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Modal with Link & QR */}
      {publishedExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Tạo đề thi thành công!</h3>
              <p className="text-xs text-slate-600 mt-1">
                Đề thi đã sẵn sàng nhận bài làm trực tuyến từ học sinh.
              </p>
            </div>

            {/* Exam Code & Link Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Mã đề thi (Học sinh có thể nhập tại trang chủ)
                </span>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-300">
                  <span className="font-mono text-base font-black text-emerald-800 tracking-wider">
                    {publishedExam.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="text-xs text-slate-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Đã sao chép' : 'Sao chép mã'}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Đường link làm bài trực tiếp
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/?examCode=${publishedExam.code}`}
                    className="flex-1 bg-white px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono text-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Đã chép!' : 'Chép link'}
                  </button>
                </div>
              </div>
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="text-center pt-1">
                <p className="text-xs font-bold text-slate-700 mb-2">
                  Quét mã QR để làm bài trên điện thoại
                </p>
                <div className="inline-block p-2 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <img src={qrCodeUrl} alt="Mã QR bài thi" className="w-40 h-40 mx-auto rounded-xl" />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  onPreviewExam(publishedExam);
                  setPublishedExam(null);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Làm thử đề thi
              </button>

              <button
                onClick={() => {
                  setPublishedExam(null);
                  onNavigateToExams();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                Đến quản lý đề thi
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
