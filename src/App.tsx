import React, { useState, useEffect } from 'react';
import { User, Question, Exam, ExamSubmission, ExamStatus } from './types/index.ts';
import {
  initializeStorage,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  getQuestions,
  saveQuestion,
  deleteQuestion,
  saveMultipleQuestions,
  getExams,
  saveExam,
  saveExamAsync,
  loadAllExamsFromServer,
  deleteExam,
  updateExamStatus,
  getSubmissions,
  saveSubmission,
  getSubmissionsByStudent,
  fetchExamByCodeFromServer,
} from './services/storage.ts';
import { Play, Sparkles, AlertCircle } from 'lucide-react';

import { Header, ActiveTab } from './components/Header.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { WordExamCreator } from './components/teacher/WordExamCreator.tsx';
import { QuickExamCreator } from './components/teacher/QuickExamCreator.tsx';
import { QuestionBank } from './components/teacher/QuestionBank.tsx';
import { WordImportModal } from './components/teacher/WordImportModal.tsx';
import { ExamManager } from './components/teacher/ExamManager.tsx';
import { ExamSubmissionsView } from './components/teacher/ExamSubmissionsView.tsx';
import { ExamList } from './components/student/ExamList.tsx';
import { ExamTaking } from './components/student/ExamTaking.tsx';
import { ExamResultView } from './components/student/ExamResultView.tsx';
import { ExamReviewView } from './components/student/ExamReviewView.tsx';
import { StudentHistory } from './components/student/StudentHistory.tsx';

export default function App() {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('exams');
  const [questions, setQuestionsState] = useState<Question[]>([]);
  const [exams, setExamsState] = useState<Exam[]>([]);
  const [submissions, setSubmissionsState] = useState<ExamSubmission[]>([]);

  // Taking & Result Screen states
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [guestName, setGuestName] = useState<string>('');
  const [guestClass, setGuestClass] = useState<string>('');
  const [activeSubmission, setActiveSubmission] = useState<ExamSubmission | null>(null);
  const [reviewSubmission, setReviewSubmission] = useState<ExamSubmission | null>(null);
  const [pendingExam, setPendingExam] = useState<Exam | null>(null);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [linkNotice, setLinkNotice] = useState<string | null>(null);

  // Helper to extract exam code or ID from query or pathname
  function extractExamCodeFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    const fromQuery =
      params.get('examCode') || params.get('code') || params.get('examId') || params.get('id');
    if (fromQuery && fromQuery.trim()) {
      return fromQuery.trim();
    }
    // Check pathname: /online-exam/CHEM-XXXX, /exam/CHEM-XXXX, /de-thi/CHEM-XXXX
    const path = window.location.pathname;
    const match = path.match(/\/(?:online-exam|exam|de-thi)\/([^/?#]+)/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1].trim());
    }
    return null;
  }

  // Initialize data and check URL parameters on mount
  useEffect(() => {
    async function init() {
      await initializeStorage();
      const user = getCurrentUser();
      setCurrentUserState(user);
      const loadedQuestions = getQuestions();
      // Load all server exams first to guarantee cross-device persistence
      const loadedExams = await loadAllExamsFromServer();
      setQuestionsState(loadedQuestions);
      setExamsState(loadedExams);
      setSubmissionsState(getSubmissions());

      const examCodeParam = extractExamCodeFromUrl();

      if (examCodeParam) {
        const found = await fetchExamByCodeFromServer(examCodeParam);
        if (found) {
          // Always ensure the found exam is present in examsState
          setExamsState(prev => {
            const idx = prev.findIndex(e => e.id === found.id || e.code === found.code);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = found;
              return copy;
            }
            return [found, ...prev];
          });

          if (found.status === 'closed') {
            setLinkNotice(`Bài thi "${found.title}" (Mã: ${found.code}) hiện đã đóng nhận bài.`);
            setActiveTab('exams');
          } else {
            setPendingExam(found);
            if (user) {
              // User already authenticated -> direct entry!
              setActiveExam(found);
            } else {
              // Not yet logged in -> show exam on list and prompt
              setActiveTab('exams');
              setLinkNotice(
                `Bạn đang mở bài thi: "${found.title}" (Mã: ${found.code}). Nhấn "Bắt đầu làm bài" để vào thi!`
              );
            }
          }
        } else {
          setLinkNotice(`Không tìm thấy bài thi với mã "${examCodeParam}". Vui lòng kiểm tra lại liên kết.`);
          setActiveTab('exams');
        }
      } else {
        if (user?.role === 'GV') {
          setActiveTab('word_exam_creator');
        } else {
          setActiveTab('exams');
        }
      }

      setIsReady(true);
    }
    init();
  }, []);

  // Update questions helper
  const handleSaveQuestion = (q: Question) => {
    saveQuestion(q);
    setQuestionsState(getQuestions());
  };

  const handleDeleteQuestion = (id: string) => {
    deleteQuestion(id);
    setQuestionsState(getQuestions());
  };

  const handleImportQuestions = (newQuestions: Question[]) => {
    saveMultipleQuestions(newQuestions);
    setQuestionsState(getQuestions());
    setActiveTab('question_bank');
  };

  // Exam helpers
  const handleSaveExam = async (exam: Exam) => {
    await saveExamAsync(exam);
    const freshExams = await loadAllExamsFromServer();
    setExamsState(freshExams);
  };

  const handleDeleteExam = (id: string) => {
    deleteExam(id);
    setExamsState(getExams());
  };

  const handleUpdateStatus = (id: string, status: ExamStatus) => {
    updateExamStatus(id, status);
    setExamsState(getExams());
  };

  // Submissions helper
  const handleExamSubmitted = (submission: ExamSubmission) => {
    saveSubmission(submission);
    setSubmissionsState(getSubmissions());
    setActiveExam(null);
    setPendingExam(null);
    setActiveSubmission(submission); // Move directly to result screen
  };

  // Auth actions
  const handleLoginSuccess = async (user: User) => {
    setCurrentUserState(user);

    // Refresh all shared exams from server upon login
    const freshExams = await loadAllExamsFromServer();
    setExamsState(freshExams);

    // If an exam was opened via link or pending, launch it immediately!
    if (pendingExam && pendingExam.status !== 'closed') {
      setActiveExam(pendingExam);
      return;
    }

    if (user.role === 'GV') {
      setActiveTab('word_exam_creator');
    } else {
      setActiveTab('exams');
    }
  };

  const handleLogout = async () => {
    clearCurrentUser();
    setCurrentUserState(null);
    setActiveExam(null);
    setActiveSubmission(null);
    setReviewSubmission(null);
    setPendingExam(null);
    const fresh = await loadAllExamsFromServer();
    setExamsState(fresh);
    setActiveTab('exams');
  };

  // Start Exam
  const handleStartExam = (exam: Exam, studentNameArg?: string, studentClassArg?: string) => {
    setActiveExam(exam);
    if (studentNameArg) setGuestName(studentNameArg);
    if (studentClassArg) setGuestClass(studentClassArg);
    setActiveSubmission(null);
    setReviewSubmission(null);
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-semibold">Đang chuẩn bị EduChem Studio...</p>
        </div>
      </div>
    );
  }

  // Active Exam Taking Mode (full viewport focus with single question view)
  if (activeExam) {
    return (
      <div className="min-h-screen bg-slate-100/70 p-4 sm:p-6 font-sans">
        <ExamTaking
          exam={activeExam}
          currentUser={currentUser}
          guestName={guestName}
          guestClass={guestClass}
          onSubmitted={handleExamSubmitted}
          onExit={() => setActiveExam(null)}
        />
      </div>
    );
  }

  // Dedicated Post-Exam Result View
  if (activeSubmission) {
    return (
      <div className="min-h-screen bg-slate-100/70 font-sans">
        <Header
          currentUser={currentUser}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveSubmission(null);
            setReviewSubmission(null);
            setActiveTab(tab);
          }}
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setIsAuthOpen(true);
          }}
          onOpenProfile={() => setIsProfileOpen(true)}
          onLogout={handleLogout}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ExamResultView
            submission={activeSubmission}
            onViewDetailedReview={() => {
              setReviewSubmission(activeSubmission);
              setActiveSubmission(null);
            }}
            onBackToExams={() => {
              setActiveSubmission(null);
              setActiveTab('exams');
            }}
            onViewHistory={() => {
              setActiveSubmission(null);
              setActiveTab('student_history');
            }}
          />
        </main>
      </div>
    );
  }

  // Review Answers & Solutions Mode
  if (reviewSubmission) {
    return (
      <div className="min-h-screen bg-slate-100/70 font-sans">
        <Header
          currentUser={currentUser}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setReviewSubmission(null);
            setActiveTab(tab);
          }}
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setIsAuthOpen(true);
          }}
          onOpenProfile={() => setIsProfileOpen(true)}
          onLogout={handleLogout}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ExamReviewView
            submission={reviewSubmission}
            onBackToResult={() => {
              setActiveSubmission(reviewSubmission);
              setReviewSubmission(null);
            }}
            onBackToExams={() => {
              setReviewSubmission(null);
              setActiveTab('exams');
            }}
          />
        </main>
      </div>
    );
  }

  // Filter student submissions
  const studentSubmissions = currentUser
    ? getSubmissionsByStudent(currentUser.id)
    : submissions;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          // If HS clicks teacher tabs, stay on exams
          if (
            currentUser?.role === 'HS' &&
            (tab === 'word_exam_creator' ||
              tab === 'quick_create' ||
              tab === 'question_bank' ||
              tab === 'word_import' ||
              tab === 'teacher_results')
          ) {
            setActiveTab('exams');
          } else {
            setActiveTab(tab);
          }
          if (tab === 'exams') {
            loadAllExamsFromServer().then(fresh => setExamsState(fresh));
          }
        }}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
      />

      {/* Prominent Direct Link Exam Card when opened via link or code */}
      {pendingExam && !activeExam && (
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white border-b border-emerald-600 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                ĐỀ THI ĐƯỢC MỞ QUA LIÊN KẾT TRỰC TUYẾN
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">{pendingExam.title}</h2>
              <div className="flex items-center gap-3 text-xs text-emerald-100 flex-wrap">
                <span>
                  Mã đề: <strong className="font-mono bg-white/15 px-2 py-0.5 rounded-md">{pendingExam.code}</strong>
                </span>
                <span>•</span>
                <span>
                  Thời gian: {pendingExam.timeLimitMinutes > 0 ? `${pendingExam.timeLimitMinutes} phút` : 'Không giới hạn'}
                </span>
                <span>•</span>
                <span>Số câu hỏi: {pendingExam.questions.length} câu</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                onClick={() => handleStartExam(pendingExam)}
                className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-emerald-800" />
                {currentUser ? 'BẮT ĐẦU LÀM BÀI' : 'VÀO THI NHANH (KHÁCH)'}
              </button>

              {!currentUser && (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthOpen(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-800/80 hover:bg-emerald-800 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Đăng nhập tài khoản
                </button>
              )}

              <button
                onClick={() => setPendingExam(null)}
                className="p-2 text-emerald-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                title="Đóng thông báo"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Link Banner notice if loaded from URL parameter and error or closed */}
      {linkNotice && !pendingExam && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3 text-xs sm:text-sm text-emerald-900 font-semibold flex items-center justify-between">
          <span>📢 {linkNotice}</span>
          <button
            onClick={() => setLinkNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Teacher Views */}
        {currentUser?.role === 'GV' && activeTab === 'word_exam_creator' && (
          <WordExamCreator
            teacherId={currentUser.id}
            onExamCreated={(newExam) => {
              handleSaveExam(newExam);
            }}
            onPreviewExam={(exam) => handleStartExam(exam)}
            onNavigateToExams={() => setActiveTab('exams')}
          />
        )}

        {currentUser?.role === 'GV' && activeTab === 'quick_create' && (
          <QuickExamCreator
            questions={questions}
            teacherId={currentUser.id}
            onExamCreated={(newExam) => {
              handleSaveExam(newExam);
            }}
            onPreviewExam={(exam) => handleStartExam(exam)}
            onNavigateToBank={() => setActiveTab('question_bank')}
          />
        )}

        {currentUser?.role === 'GV' && activeTab === 'exams' && (
          <ExamManager
            exams={exams}
            questions={questions}
            onSaveExam={handleSaveExam}
            onDeleteExam={handleDeleteExam}
            onUpdateStatus={handleUpdateStatus}
            onStartTakeExam={(exam) => handleStartExam(exam)}
            onViewSubmissions={() => setActiveTab('teacher_results')}
            onNavigateToQuickCreate={() => setActiveTab('quick_create')}
            onNavigateToWordExam={() => setActiveTab('word_exam_creator')}
            teacherId={currentUser.id}
          />
        )}

        {currentUser?.role === 'GV' && activeTab === 'question_bank' && (
          <QuestionBank
            questions={questions}
            onSaveQuestion={handleSaveQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onNavigateToImport={() => setActiveTab('word_import')}
          />
        )}

        {currentUser?.role === 'GV' && activeTab === 'word_import' && (
          <WordImportModal onImportComplete={handleImportQuestions} />
        )}

        {currentUser?.role === 'GV' && activeTab === 'teacher_results' && (
          <ExamSubmissionsView
            submissions={submissions}
            exams={exams}
            onReviewSubmission={(sub) => setReviewSubmission(sub)}
            onUpdateSubmission={() => setSubmissionsState(getSubmissions())}
          />
        )}

        {/* Student Views or Guest Views */}
        {(currentUser?.role === 'HS' || !currentUser) && activeTab === 'exams' && (
          <ExamList
            exams={exams}
            currentUser={currentUser}
            onStartExam={handleStartExam}
            onOpenAuth={(mode) => {
              setAuthMode(mode);
              setIsAuthOpen(true);
            }}
          />
        )}

        {activeTab === 'student_history' && (
          <StudentHistory
            submissions={studentSubmissions}
            onReviewSubmission={(sub) => setReviewSubmission(sub)}
            onTakeNewExam={() => setActiveTab('exams')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2025 EduChem Studio • Hệ thống khảo sát & thi Hóa học GDPT 2018</p>
          <p className="text-[11px] text-slate-400">
            Hỗ trợ cấu trúc 3 phần: Trắc nghiệm 4 lựa chọn, Đúng/Sai 4 phát biểu, Trả lời ngắn
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {currentUser && (
        <ProfileModal
          isOpen={isProfileOpen}
          currentUser={currentUser}
          onClose={() => setIsProfileOpen(false)}
          onUpdated={(updated) => setCurrentUserState(updated)}
        />
      )}
    </div>
  );
}
