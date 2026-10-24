import React, { useState } from 'react';
import { ExamSubmission } from '../../types/index.ts';
import { ChemistryText } from '../ChemistryText.tsx';
import { formatScore } from '../../services/scoring.ts';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  BookOpen,
  Check,
  X,
  Award,
  Filter,
} from 'lucide-react';

interface ExamReviewViewProps {
  submission: ExamSubmission;
  onBackToResult: () => void;
  onBackToExams: () => void;
}

export const ExamReviewView: React.FC<ExamReviewViewProps> = ({
  submission,
  onBackToResult,
  onBackToExams,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const questions = submission.questionsSnapshot || [];
  const results = submission.questionResults || [];

  const filteredItems = questions.map((q, idx) => ({
    question: q,
    result: results.find(r => r.questionId === q.id) || {
      questionId: q.id,
      type: q.type,
      maxPoints: 0,
      earnedPoints: 0,
      status: 'unanswered',
      studentAnswer: null,
      correctAnswer: null,
    },
    index: idx + 1,
  })).filter(item => {
    if (filterStatus === 'all') return true;
    return item.result.status === filterStatus;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-18 z-30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Chi tiết bài làm & Lời giải
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Điểm: <strong>{formatScore(submission.totalScore)}</strong> / {formatScore(submission.maxScore)}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{submission.examTitle}</h1>
          <p className="text-xs text-slate-500">
            Học sinh: {submission.studentName} {submission.studentClass ? `(${submission.studentClass})` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToResult}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Xem tổng kết điểm
          </button>
          <button
            onClick={onBackToExams}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Danh sách đề thi
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Lọc câu:
        </span>
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
            filterStatus === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Tất cả ({questions.length})
        </button>
        <button
          onClick={() => setFilterStatus('correct')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
            filterStatus === 'correct'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          Đúng ({submission.correctCount})
        </button>
        <button
          onClick={() => setFilterStatus('partially_correct')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
            filterStatus === 'partially_correct'
              ? 'bg-amber-500 text-white'
              : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
          }`}
        >
          Đúng một phần ({submission.partiallyCorrectCount})
        </button>
        <button
          onClick={() => setFilterStatus('incorrect')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
            filterStatus === 'incorrect'
              ? 'bg-rose-600 text-white'
              : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
          }`}
        >
          Sai ({submission.incorrectCount})
        </button>
        <button
          onClick={() => setFilterStatus('unanswered')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
            filterStatus === 'unanswered'
              ? 'bg-slate-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Chưa làm ({submission.unansweredCount})
        </button>
      </div>

      {/* Review Questions List */}
      <div className="space-y-6">
        {filteredItems.map(({ question: q, result, index }) => {
          let statusBadge = (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
              Chưa trả lời
            </span>
          );

          if (result.status === 'correct') {
            statusBadge = (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đúng hoàn toàn
              </span>
            );
          } else if (result.status === 'partially_correct') {
            statusBadge = (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Đúng một phần
              </span>
            );
          } else if (result.status === 'incorrect') {
            statusBadge = (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" /> Làm sai
              </span>
            );
          }

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border p-6 shadow-xs transition-all ${
                result.status === 'correct'
                  ? 'border-emerald-200'
                  : result.status === 'partially_correct'
                  ? 'border-amber-200'
                  : result.status === 'incorrect'
                  ? 'border-rose-200'
                  : 'border-slate-200'
              }`}
            >
              {/* Question header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-extrabold text-xs">
                    Câu {index}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {q.type === 'multiple_choice'
                      ? 'Trắc nghiệm 4 lựa chọn'
                      : q.type === 'true_false'
                      ? 'Đúng / Sai 4 phát biểu'
                      : 'Trả lời ngắn'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    [{q.level || 'BIẾT'}]
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {statusBadge}
                  <span className="text-xs font-bold text-slate-700 px-2.5 py-1 rounded-lg bg-slate-100">
                    +{formatScore(result.earnedPoints)} / {formatScore(result.maxPoints)} đ
                  </span>
                </div>
              </div>

              {/* Stem */}
              <div className="text-base font-medium text-slate-800 mb-5 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                <ChemistryText content={q.stem} />
              </div>

              {/* Multiple Choice review details */}
              {q.type === 'multiple_choice' && (
                <div className="space-y-2 mb-4">
                  {q.options.map(opt => {
                    const isStudentChosen = result.studentAnswer === opt.id;
                    const isStandardCorrect = q.correctAnswer === opt.id;

                    let rowStyle = 'bg-white border-slate-200 text-slate-700';
                    if (isStandardCorrect) {
                      rowStyle = 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-semibold';
                    } else if (isStudentChosen && !isStandardCorrect) {
                      rowStyle = 'bg-rose-50/80 border-rose-300 text-rose-950 font-semibold';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs sm:text-sm ${rowStyle}`}
                      >
                        <div className="flex items-start gap-2.5 flex-1">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                              isStandardCorrect
                                ? 'bg-emerald-600 text-white'
                                : isStudentChosen
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <div className="flex-1 pt-0.5">
                            <ChemistryText content={opt.text} />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isStudentChosen && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isStandardCorrect
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : 'bg-rose-200 text-rose-900'
                              }`}
                            >
                              Bạn chọn
                            </span>
                          )}
                          {isStandardCorrect && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1">
                              <Check className="w-3 h-3" /> Đáp án chuẩn
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* True / False review details */}
              {q.type === 'true_false' && (
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-semibold text-slate-600 mb-1">
                    Đối chiếu từng phát biểu theo thang điểm Bộ GD&ĐT:
                  </div>
                  {q.statements.map(st => {
                    const stRes = result.details?.statementResults?.[st.id];
                    const studentVal = stRes?.student;
                    const correctVal = st.correctAnswer;
                    const isMatch = stRes?.isMatch;

                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isMatch
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : studentVal !== null && studentVal !== undefined
                            ? 'bg-rose-50/50 border-rose-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <span className="font-extrabold text-slate-800 w-5 shrink-0">{st.id})</span>
                          <div className="text-slate-800 text-xs sm:text-sm">
                            <ChemistryText content={st.text} />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-slate-500">Bạn chọn:</span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                studentVal === true
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : studentVal === false
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {studentVal === true ? 'ĐÚNG' : studentVal === false ? 'SAI' : 'Bỏ trống'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-slate-500">Đáp án chuẩn:</span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                correctVal === true
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              {correctVal === true ? 'ĐÚNG' : correctVal === false ? 'SAI' : 'Chưa set'}
                            </span>
                          </div>

                          {isMatch ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Short answer review details */}
              {q.type === 'short_answer' && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 font-medium">Câu trả lời của bạn: </span>
                      <strong
                        className={`font-bold ml-1 ${
                          result.status === 'correct' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {result.studentAnswer || '(Chưa điền đáp án)'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Đáp án chuẩn: </span>
                      <strong className="text-emerald-700 font-bold ml-1">
                        {q.correctAnswer || '(Chưa có)'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Explanation / Solution */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm text-blue-950">
                <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-700" />
                  Hướng dẫn giải chi tiết:
                </div>
                {q.explanation ? (
                  <ChemistryText content={q.explanation} className="text-blue-900 leading-relaxed" />
                ) : (
                  <p className="text-slate-400 italic">Chưa có hướng dẫn giải cho câu hỏi này.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
