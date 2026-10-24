import React, { useState } from 'react';
import { Question, QuestionType, DifficultyLevel } from '../../types/index.ts';
import { ChemistryText } from '../ChemistryText.tsx';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  BookOpen,
  CheckCircle2,
  X,
  Save,
  Check,
  AlertCircle,
} from 'lucide-react';

interface QuestionBankProps {
  questions: Question[];
  onSaveQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onNavigateToImport: () => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  questions,
  onSaveQuestion,
  onDeleteQuestion,
  onNavigateToImport,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const filteredQuestions = questions.filter(q => {
    if (typeFilter !== 'all' && q.type !== typeFilter) return false;
    if (levelFilter !== 'all' && q.level !== levelFilter) return false;
    if (search.trim()) {
      const matchText = (q.stem + ' ' + (q.code || '') + ' ' + (q.explanation || '')).toLowerCase();
      if (!matchText.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    const newQ: Question = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: `CH-${questions.length + 1}`,
      type: 'multiple_choice',
      level: 'BIẾT',
      stem: '',
      topic: 'Cân bằng hóa học',
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ],
      correctAnswer: 'A',
      createdAt: new Date().toISOString(),
    };
    setEditingQuestion(newQ);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(JSON.parse(JSON.stringify(q)));
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editingQuestion.stem.trim()) return;
    onSaveQuestion(editingQuestion);
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleTypeChange = (newType: QuestionType) => {
    if (!editingQuestion) return;
    if (editingQuestion.type === newType) return;

    if (newType === 'multiple_choice') {
      setEditingQuestion({
        ...editingQuestion,
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
      setEditingQuestion({
        ...editingQuestion,
        type: 'true_false',
        statements: [
          { id: 'a', text: '', correctAnswer: true },
          { id: 'b', text: '', correctAnswer: false },
          { id: 'c', text: '', correctAnswer: true },
          { id: 'd', text: '', correctAnswer: false },
        ],
      });
    } else {
      setEditingQuestion({
        ...editingQuestion,
        type: 'short_answer',
        correctAnswer: '',
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Stats */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-800">Ngân hàng câu hỏi Hóa học</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Tổng cộng: <strong>{questions.length}</strong> câu hỏi • GDPT 2018 theo định dạng đánh giá năng lực mới.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToImport}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-teal-600 text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
          >
            Nhập file Word
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Thêm câu hỏi mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm nội dung, mã câu hỏi, chủ đề..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
          >
            <option value="all">Tất cả dạng câu</option>
            <option value="multiple_choice">Trắc nghiệm 4 lựa chọn</option>
            <option value="true_false">Đúng / Sai</option>
            <option value="short_answer">Trả lời ngắn</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="BIẾT">Nhận biết</option>
            <option value="HIỂU">Thông hiểu</option>
            <option value="VẬN DỤNG">Vận dụng</option>
            <option value="VẬN DỤNG CAO">Vận dụng cao</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">Không tìm thấy câu hỏi phù hợp.</p>
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setLevelFilter('all');
              }}
              className="mt-2 text-xs text-emerald-600 hover:underline"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                    {q.code || `Câu ${idx + 1}`}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      q.type === 'multiple_choice'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : q.type === 'true_false'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {q.type === 'multiple_choice'
                      ? 'Trắc nghiệm 4 lựa chọn'
                      : q.type === 'true_false'
                      ? 'Đúng / Sai'
                      : 'Trả lời ngắn'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                    {q.level || 'Chưa phân loại'}
                  </span>
                  {q.topic && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Chủ đề: {q.topic}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
                        onDeleteQuestion(q.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stem */}
              <div className="text-sm font-medium text-slate-800 mb-3">
                <ChemistryText content={q.stem} />
              </div>

              {/* Sub items display */}
              {q.type === 'multiple_choice' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
                  {q.options.map(opt => (
                    <div
                      key={opt.id}
                      className={`p-2 rounded-lg border flex items-start gap-2 ${
                        q.correctAnswer === opt.id
                          ? 'bg-emerald-50/70 border-emerald-300 font-semibold text-emerald-950'
                          : 'bg-slate-50/50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded text-[11px] flex items-center justify-center font-bold shrink-0 ${
                          q.correctAnswer === opt.id ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {opt.id}
                      </span>
                      <div className="flex-1">
                        <ChemistryText content={opt.text} />
                      </div>
                      {q.correctAnswer === opt.id && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {q.type === 'true_false' && (
                <div className="space-y-1 text-xs mb-2">
                  {q.statements.map(st => (
                    <div
                      key={st.id}
                      className="p-2 rounded-lg border border-slate-200 bg-slate-50/40 flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2 flex-1">
                        <span className="font-bold text-slate-700 w-4 shrink-0">{st.id})</span>
                        <div className="flex-1">
                          <ChemistryText content={st.text} />
                        </div>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          st.correctAnswer === true
                            ? 'bg-emerald-100 text-emerald-800'
                            : st.correctAnswer === false
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {st.correctAnswer === true ? 'ĐÚNG' : st.correctAnswer === false ? 'SAI' : 'Chưa set'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {q.type === 'short_answer' && (
                <div className="p-2 rounded-lg bg-amber-50/50 border border-amber-200 text-xs mb-2 flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Đáp án chuẩn:</span>
                  <strong className="text-amber-900 font-bold">{q.correctAnswer || '(Chưa có)'}</strong>
                </div>
              )}

              {q.explanation && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100">
                  <strong className="text-slate-700">Lời giải: </strong>
                  <ChemistryText content={q.explanation} className="inline" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Question Modal */}
      {isModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                {editingQuestion.id.startsWith('q-') && !questions.some(q => q.id === editingQuestion.id)
                  ? 'Thêm câu hỏi mới'
                  : 'Chỉnh sửa câu hỏi'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã câu hỏi</label>
                  <input
                    type="text"
                    value={editingQuestion.code || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, code: e.target.value })
                    }
                    placeholder="CH-01"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dạng câu hỏi</label>
                  <select
                    value={editingQuestion.type}
                    onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="multiple_choice">Trắc nghiệm 4 lựa chọn</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="short_answer">Trả lời ngắn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ nhận thức</label>
                  <select
                    value={editingQuestion.level || 'BIẾT'}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        level: e.target.value as DifficultyLevel,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="BIẾT">[BIẾT] Nhận biết</option>
                    <option value="HIỂU">[HIỂU] Thông hiểu</option>
                    <option value="VẬN DỤNG">[VẬN DỤNG] Vận dụng</option>
                    <option value="VẬN DỤNG CAO">[VẬN DỤNG CAO] Vận dụng cao</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chủ đề / Bài học</label>
                <input
                  type="text"
                  value={editingQuestion.topic || ''}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, topic: e.target.value })
                  }
                  placeholder="Cân bằng hóa học"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Câu dẫn (Đề bài) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingQuestion.stem}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, stem: e.target.value })
                  }
                  placeholder="Nhập nội dung đề bài câu hỏi..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {editingQuestion.type === 'multiple_choice' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Các phương án A, B, C, D</label>
                  {editingQuestion.options.map((opt, oIdx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <span className="w-5 font-bold text-xs text-slate-700">{opt.id}.</span>
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...editingQuestion.options];
                          updated[oIdx] = { ...opt, text: e.target.value };
                          setEditingQuestion({ ...editingQuestion, options: updated });
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="correctOpt"
                          checked={editingQuestion.correctAnswer === opt.id}
                          onChange={() =>
                            setEditingQuestion({ ...editingQuestion, correctAnswer: opt.id })
                          }
                        />
                        <span className="text-xs text-emerald-700 font-semibold">Đúng</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {editingQuestion.type === 'true_false' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">4 Phát biểu a, b, c, d</label>
                  {editingQuestion.statements.map((st, sIdx) => (
                    <div key={st.id} className="p-2 border rounded-lg bg-slate-50 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-4 font-bold text-xs text-slate-700">{st.id})</span>
                        <input
                          type="text"
                          required
                          value={st.text}
                          onChange={(e) => {
                            const updated = [...editingQuestion.statements];
                            updated[sIdx] = { ...st, text: e.target.value };
                            setEditingQuestion({ ...editingQuestion, statements: updated });
                          }}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-3 text-xs pr-2">
                        <span className="text-[11px] text-slate-500">Đáp án chuẩn:</span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`stmt-${st.id}`}
                            checked={st.correctAnswer === true}
                            onChange={() => {
                              const updated = [...editingQuestion.statements];
                              updated[sIdx] = { ...st, correctAnswer: true };
                              setEditingQuestion({ ...editingQuestion, statements: updated });
                            }}
                          />
                          <span className="text-emerald-700 font-bold">ĐÚNG</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`stmt-${st.id}`}
                            checked={st.correctAnswer === false}
                            onChange={() => {
                              const updated = [...editingQuestion.statements];
                              updated[sIdx] = { ...st, correctAnswer: false };
                              setEditingQuestion({ ...editingQuestion, statements: updated });
                            }}
                          />
                          <span className="text-rose-700 font-bold">SAI</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {editingQuestion.type === 'short_answer' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đáp án chuẩn</label>
                  <input
                    type="text"
                    required
                    value={editingQuestion.correctAnswer || ''}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        correctAnswer: e.target.value,
                      })
                    }
                    placeholder="Ví dụ: 33 hoặc 0,5"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lời giải / Hướng dẫn giải chi tiết</label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      explanation: e.target.value,
                    })
                  }
                  placeholder="Nhập hướng dẫn giải thích cho câu hỏi này..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" /> Lưu vào ngân hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
