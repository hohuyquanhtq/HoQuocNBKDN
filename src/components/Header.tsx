import React from 'react';
import { User } from '../types/index.ts';
import {
  FlaskConical,
  LogOut,
  User as UserIcon,
  BookOpen,
  Layers,
  FileSpreadsheet,
  History,
  Award,
  Zap,
} from 'lucide-react';

export type ActiveTab =
  | 'quick_create'
  | 'question_bank'
  | 'word_import'
  | 'exams'
  | 'student_take_exam'
  | 'student_history'
  | 'teacher_results';

interface HeaderProps {
  currentUser: User | null;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onOpenAuth,
  onOpenProfile,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => onSelectTab(currentUser?.role === 'GV' ? 'quick_create' : 'exams')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-emerald-700 via-teal-800 to-cyan-900 bg-clip-text text-transparent">
                  EduChem Studio
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  2025 GDPT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Ngân hàng đề & Thi trực tuyến Hóa học</p>
            </div>
          </div>

          {/* Navigation Links for Authenticated Users */}
          {currentUser && (
            <nav className="hidden lg:flex items-center gap-1">
              {currentUser.role === 'GV' ? (
                <>
                  <button
                    onClick={() => onSelectTab('quick_create')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === 'quick_create'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                        : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Tạo đề nhanh & Giao bài
                  </button>

                  <button
                    onClick={() => onSelectTab('exams')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === 'exams'
                        ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Quản lý đề thi
                  </button>

                  <button
                    onClick={() => onSelectTab('question_bank')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === 'question_bank'
                        ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Ngân hàng câu hỏi
                  </button>

                  <button
                    onClick={() => onSelectTab('word_import')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === 'word_import'
                        ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Nhập Word (.docx)
                  </button>

                  <button
                    onClick={() => onSelectTab('teacher_results')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === 'teacher_results'
                        ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    Báo cáo kết quả
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onSelectTab('exams')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === 'exams' || activeTab === 'student_take_exam'
                        ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Danh sách đề thi
                  </button>

                  <button
                    onClick={() => onSelectTab('student_history')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === 'student_history'
                        ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    Lịch sử bài thi
                  </button>
                </>
              )}
            </nav>
          )}

          {/* Right Action buttons / User profile */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50 transition-all text-left"
                  title="Nhấn để xem và chỉnh sửa hồ sơ"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs">
                    {currentUser.role}
                  </div>
                  <div className="hidden sm:block text-xs">
                    <p className="font-bold text-slate-800 leading-tight">{currentUser.fullName}</p>
                    <p className="text-[10px] text-slate-500">
                      {currentUser.role === 'GV' ? 'Giáo viên Hóa học' : `Học sinh ${currentUser.className || ''}`}
                    </p>
                  </div>
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
                  title="Đăng xuất khỏi hệ thống"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
