import React, { useState } from 'react';
import { Question, QuestionType, DifficultyLevel } from '../../types/index.ts';
import { parseDocxFile } from '../../services/docxParser.ts';
import { downloadSampleDocx } from '../../services/docxGenerator.ts';
import { ChemistryText } from '../ChemistryText.tsx';
import {
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  Save,
  BookOpen,
  HelpCircle,
  X,
  FileCheck2,
} from 'lucide-react';

interface WordImportModalProps {
  onImportComplete: (questions: Question[]) => void;
}

export const WordImportModal: React.FC<WordImportModalProps> = ({ onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleDownloadSample = async () => {
    try {
      await downloadSampleDocx();
    } catch (err) {
      console.error('Failed to generate sample docx:', err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setIsLoading(true);
    setWarnings([]);
    setSuccessMessage(null);

    try {
      const res = await parseDocxFile(selected);
      setParsedQuestions(res.questions);
      setWarnings(res.warnings);
    } catch (err) {
      console.error('Docx parse error:', err);
      setWarnings(['Không thể phân tích file DOCX. Vui lòng kiểm tra lại định dạng file.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditedQuestion(JSON.parse(JSON.stringify(parsedQuestions[index])));
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editedQuestion) return;
    const updated = [...parsedQuestions];
    updated[editingIndex] = editedQuestion;
    setParsedQuestions(updated);
    setEditingIndex(null);
    setEditedQuestion(null);
  };

  const handleDeleteParsed = (index: number) => {
    const updated = parsedQuestions.filter((_, i) => i !== index);
    setParsedQuestions(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditedQuestion(null);
    }
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
      });
    }
  };

  const handleConfirmImport = () => {
    if (parsedQuestions.length === 0) return;
    onImportComplete(parsedQuestions);
    setSuccessMessage(`Đã nhập thành công ${parsedQuestions.length} câu hỏi vào Ngân hàng câu hỏi!`);
    setParsedQuestions([]);
    setFile(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero / Instruction Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                <FileCheck2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-800">Nhập câu hỏi từ file Word (.docx)</h1>
            </div>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Tải lên file Word đề thi Hóa học theo chuẩn mới 2025. Hệ thống tự động nhận diện câu hỏi trắc nghiệm, đúng/sai, trả lời ngắn, đáp án và lời giải chi tiết.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Download Sample DOCX button as requested in Section 3.1 */}
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-600 text-teal-700 bg-teal-50/50 hover:bg-teal-100 hover:text-teal-800 font-semibold text-sm transition-all shadow-xs"
              title="Tải file mẫu chuẩn có sẵn 3 dạng câu hỏi và hướng dẫn"
            >
              <Download className="w-4 h-4" />
              Tải file Word mẫu
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer">
              <Upload className="w-4 h-4" />
              Chọn file DOCX tải lên
              <input
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {file && (
          <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đang xử lý tệp: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <span className="font-semibold text-emerald-700">Đã nhận diện {parsedQuestions.length} câu hỏi</span>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Warnings List */}
      {warnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-800 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Cảnh báo cấu trúc ({warnings.length}):
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-2 max-h-32 overflow-y-auto">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">Đang đọc tài liệu Word và tách cấu trúc câu hỏi...</p>
        </div>
      )}

      {/* Preview and Edit Section */}
      {parsedQuestions.length > 0 && !isLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">
                Xem trước & Hiệu chỉnh câu hỏi ({parsedQuestions.length})
              </h2>
              <span className="text-xs text-slate-500">
                (Vui lòng kiểm tra lại câu dẫn, đáp án chuẩn trước khi lưu)
              </span>
            </div>

            <button
              onClick={handleConfirmImport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Xác nhận nhập ({parsedQuestions.length} câu) vào Ngân hàng
            </button>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {parsedQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-xs">
                      Câu {idx + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                        q.type === 'multiple_choice'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : q.type === 'true_false'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {q.type === 'multiple_choice'
                        ? 'Trắc nghiệm 4 lựa chọn'
                        : q.type === 'true_false'
                        ? 'Đúng / Sai 4 ý'
                        : 'Trả lời ngắn'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      Mức độ: {q.level || 'Chưa phân loại'}
                    </span>
                    {q.warnings && q.warnings.length > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Cần kiểm tra
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStartEdit(idx)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Chỉnh sửa câu này"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteParsed(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Xóa khỏi danh sách nhập"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Stem */}
                <div className="text-sm font-medium text-slate-800 mb-3 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                  <ChemistryText content={q.stem} />
                </div>

                {/* Sub items based on question type */}
                {q.type === 'multiple_choice' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                    {q.options.map(opt => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                          q.correctAnswer === opt.id
                            ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                            q.correctAnswer === opt.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <div className="flex-1">
                          <ChemistryText content={opt.text} />
                        </div>
                        {q.correctAnswer === opt.id && (
                          <span className="text-[10px] uppercase font-bold text-emerald-700 px-1.5 py-0.5 rounded bg-emerald-100/70 shrink-0">
                            Đáp án đúng
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div className="space-y-1.5 text-xs mb-3">
                    {q.statements.map(st => (
                      <div
                        key={st.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <span className="font-bold text-slate-700 w-5 shrink-0">{st.id})</span>
                          <div className="flex-1 text-slate-800">
                            <ChemistryText content={st.text} />
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500">Đáp án:</span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-xs ${
                              st.correctAnswer === true
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : st.correctAnswer === false
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {st.correctAnswer === true ? 'ĐÚNG' : st.correctAnswer === false ? 'SAI' : 'Chưa có'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/80 text-xs mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-slate-600 font-medium">Đáp án chuẩn: </span>
                      <strong className="text-amber-900 font-bold text-sm ml-1">
                        {q.correctAnswer || '(Chưa nhập đáp án)'}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-blue-900">
                    <span className="font-bold text-blue-800">Hướng dẫn giải: </span>
                    <ChemistryText content={q.explanation} className="mt-0.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingIndex !== null && editedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                Hiệu chỉnh Câu {editingIndex + 1}
              </h3>
              <button
                onClick={() => setEditingIndex(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loại câu hỏi</label>
                  <select
                    value={editedQuestion.type}
                    onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="multiple_choice">Trắc nghiệm 4 lựa chọn (A/B/C/D)</option>
                    <option value="true_false">Đúng / Sai 4 phát biểu (a/b/c/d)</option>
                    <option value="short_answer">Trả lời ngắn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ nhận thức</label>
                  <select
                    value={editedQuestion.level || 'CHƯA PHÂN LOẠI'}
                    onChange={(e) =>
                      setEditedQuestion({
                        ...editedQuestion,
                        level: e.target.value as DifficultyLevel,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="BIẾT">[BIẾT] Nhận biết</option>
                    <option value="HIỂU">[HIỂU] Thông hiểu</option>
                    <option value="VẬN DỤNG">[VẬN DỤNG] Vận dụng</option>
                    <option value="VẬN DỤNG CAO">[VẬN DỤNG CAO] Vận dụng cao</option>
                    <option value="CHƯA PHÂN LOẠI">Chưa phân loại</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Câu dẫn</label>
                <textarea
                  rows={3}
                  value={editedQuestion.stem}
                  onChange={(e) =>
                    setEditedQuestion({ ...editedQuestion, stem: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {editedQuestion.type === 'multiple_choice' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Các phương án A, B, C, D</label>
                  {editedQuestion.options.map((opt, oIdx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <span className="w-6 font-bold text-xs text-slate-700 text-center">{opt.id}.</span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...editedQuestion.options];
                          updated[oIdx] = { ...opt, text: e.target.value };
                          setEditedQuestion({ ...editedQuestion, options: updated });
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="correct-opt"
                          checked={editedQuestion.correctAnswer === opt.id}
                          onChange={() =>
                            setEditedQuestion({ ...editedQuestion, correctAnswer: opt.id })
                          }
                        />
                        <span className="text-[11px] text-emerald-700 font-semibold">Đúng</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {editedQuestion.type === 'true_false' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Các phát biểu a, b, c, d</label>
                  {editedQuestion.statements.map((st, sIdx) => (
                    <div key={st.id} className="p-2 border rounded-lg bg-slate-50 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 font-bold text-xs text-slate-700">{st.id})</span>
                        <input
                          type="text"
                          value={st.text}
                          onChange={(e) => {
                            const updated = [...editedQuestion.statements];
                            updated[sIdx] = { ...st, text: e.target.value };
                            setEditedQuestion({ ...editedQuestion, statements: updated });
                          }}
                          className="flex-1 px-3 py-1 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-3 text-xs pr-2">
                        <span className="text-[11px] text-slate-500">Đáp án:</span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`tf-${st.id}`}
                            checked={st.correctAnswer === true}
                            onChange={() => {
                              const updated = [...editedQuestion.statements];
                              updated[sIdx] = { ...st, correctAnswer: true };
                              setEditedQuestion({ ...editedQuestion, statements: updated });
                            }}
                          />
                          <span className="text-emerald-700 font-bold">ĐÚNG</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`tf-${st.id}`}
                            checked={st.correctAnswer === false}
                            onChange={() => {
                              const updated = [...editedQuestion.statements];
                              updated[sIdx] = { ...st, correctAnswer: false };
                              setEditedQuestion({ ...editedQuestion, statements: updated });
                            }}
                          />
                          <span className="text-rose-700 font-bold">SAI</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {editedQuestion.type === 'short_answer' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đáp án chuẩn</label>
                  <input
                    type="text"
                    value={editedQuestion.correctAnswer || ''}
                    onChange={(e) =>
                      setEditedQuestion({
                        ...editedQuestion,
                        correctAnswer: e.target.value,
                      })
                    }
                    placeholder="Ví dụ: 33 hoặc 0,5"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lời giải chi tiết</label>
                <textarea
                  rows={2}
                  value={editedQuestion.explanation || ''}
                  onChange={(e) =>
                    setEditedQuestion({
                      ...editedQuestion,
                      explanation: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" /> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
