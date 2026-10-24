import mammoth from 'mammoth';
import { Question, QuestionType, DifficultyLevel, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion } from '../types/index.ts';

export interface ParseResult {
  questions: Question[];
  rawText: string;
  errors: string[];
  warnings: string[];
}

export async function parseDocxFile(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();

  // Extract both HTML and raw text
  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ arrayBuffer }),
    mammoth.extractRawText({ arrayBuffer }),
  ]);

  const rawText = textResult.value || '';
  const htmlContent = htmlResult.value || '';

  const questions = parseTextIntoQuestions(rawText, htmlContent);

  const warnings: string[] = [];
  const errors: string[] = [];

  if (questions.length === 0) {
    warnings.push('Không nhận diện được câu hỏi nào từ file Word. Vui lòng kiểm tra định dạng theo mẫu.');
  }

  questions.forEach((q, idx) => {
    if (q.warnings && q.warnings.length > 0) {
      warnings.push(`Câu ${idx + 1}: ${q.warnings.join(', ')}`);
    }
  });

  return {
    questions,
    rawText,
    errors,
    warnings,
  };
}

export function parseTextIntoQuestions(text: string, _htmlContent?: string): Question[] {
  // Normalize line endings
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' '); // Non-breaking space

  // Split into Main Content, Answer Table Section, and Detailed Solutions Section
  let mainBody = normalized;
  let answerSection = '';
  let solutionSection = '';

  // Standalone section: "HƯỚNG DẪN GIẢI CHI TIẾT" or "LỜI GIẢI CHI TIẾT" at bottom of document
  const solutionMatch = /(?:^|\n)\s*(?:HƯỚNG DẪN GIẢI CHI TIẾT|LỜI GIẢI CHI TIẾT)[:\s]*\n([\s\S]*)$/i.exec(normalized);
  if (solutionMatch) {
    solutionSection = solutionMatch[1];
    mainBody = normalized.substring(0, solutionMatch.index);
  }

  // Standalone section: "ĐÁP ÁN:" or "BẢNG ĐÁP ÁN:" at bottom, typically followed by PHẦN I or a table or Câu 1
  const answerMatch = /(?:^|\n)\s*(?:ĐÁP ÁN|BẢNG ĐÁP ÁN)\s*:\s*\n\s*(?:PHẦN|Câu|\d+|Lệnh hỏi|Mức độ)([\s\S]*)$/i.exec(mainBody);
  if (answerMatch) {
    answerSection = answerMatch[0];
    mainBody = mainBody.substring(0, answerMatch.index);
  }

  // Parse bottom answer table if present
  const parsedBottomAnswers = parseAnswerSection(answerSection);
  const parsedBottomSolutions = parseSolutionSection(solutionSection);

  // Divide main body into question chunks
  // Question headers: [BIẾT] Câu 1. / Câu 1: / Câu 1. / [HIỂU – VẬN DỤNG] Câu 1:
  const questionRegex = /(?:^|\n)\s*(?:\[([^\]]+)\]\s*)?Câu\s*(\d+)[\.:\s]/gi;
  const matches: { index: number; fullMatch: string; level?: string; qNum: number }[] = [];

  let match;
  while ((match = questionRegex.exec(mainBody)) !== null) {
    // Avoid false positive if "Câu" is inside middle of sentence without newline
    matches.push({
      index: match.index,
      fullMatch: match[0],
      level: match[1]?.trim(),
      qNum: parseInt(match[2], 10),
    });
  }

  if (matches.length === 0) {
    return [];
  }

  const rawQuestions: {
    raw: string;
    level?: string;
    qNum: number;
    partContext?: string;
  }[] = [];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : mainBody.length;
    const chunk = mainBody.substring(start, end).trim();

    // Check if there was a "PHẦN I", "PHẦN II", "PHẦN III" preceding this question
    const precedingText = mainBody.substring(i === 0 ? 0 : matches[i - 1].index, start);
    let partContext = '';
    if (/PHẦN\s*I\s*[:\-]/i.test(precedingText) || /TRẮC\s*NGHIỆM/i.test(precedingText)) {
      partContext = 'PHẦN I';
    } else if (/PHẦN\s*II\s*[:\-]/i.test(precedingText) || /ĐÚNG\s*SAI/i.test(precedingText)) {
      partContext = 'PHẦN II';
    } else if (/PHẦN\s*III\s*[:\-]/i.test(precedingText) || /TRẢ\s*LỜI\s*NGẮN/i.test(precedingText)) {
      partContext = 'PHẦN III';
    }

    rawQuestions.push({
      raw: chunk,
      level: matches[i].level,
      qNum: matches[i].qNum,
      partContext,
    });
  }

  const result: Question[] = [];

  for (let i = 0; i < rawQuestions.length; i++) {
    const item = rawQuestions[i];
    const parsed = parseSingleQuestion(
      item.raw,
      i + 1,
      item.level,
      item.partContext,
      parsedBottomAnswers,
      parsedBottomSolutions
    );
    if (parsed) {
      result.push(parsed);
    }
  }

  return result;
}

function parseSingleQuestion(
  raw: string,
  index: number,
  extractedLevel?: string,
  partContext?: string,
  bottomAnswers?: BottomAnswersMap,
  bottomSolutions?: Record<number, string>
): Question {
  const warnings: string[] = [];
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  // Clean first line to extract level and question stem start
  let firstLine = lines[0] || '';
  let level: DifficultyLevel = 'CHƯA PHÂN LOẠI';
  if (extractedLevel) {
    const normLevel = extractedLevel.toUpperCase();
    if (normLevel.includes('BIẾT')) level = 'BIẾT';
    else if (normLevel.includes('HIỂU')) level = 'HIỂU';
    else if (normLevel.includes('CAO')) level = 'VẬN DỤNG CAO';
    else if (normLevel.includes('DỤNG')) level = 'VẬN DỤNG';
  }

  // Remove "Câu X." or "[LEVEL] Câu X." from first line
  firstLine = firstLine.replace(/^(?:\[[^\]]+\]\s*)?Câu\s*\d+[\.:\s]*/i, '').trim();
  lines[0] = firstLine;

  // Extract inline solution if present
  let inlineExplanation = '';
  const expIdx = lines.findIndex(l => /^(?:Lời\s*giải|Hướng\s*dẫn\s*giải)[:\s]/i.test(l));
  if (expIdx !== -1) {
    inlineExplanation = lines.slice(expIdx).join('\n').replace(/^(?:Lời\s*giải|Hướng\s*dẫn\s*giải)[:\s]*/i, '').trim();
    lines.splice(expIdx);
  }

  // Extract inline answer if present
  let inlineAnswer = '';
  const ansIdx = lines.findIndex(l => /^Đáp\s*án[:\s]/i.test(l));
  if (ansIdx !== -1) {
    inlineAnswer = lines[ansIdx].replace(/^Đáp\s*án[:\s]*/i, '').trim();
    // Check if subsequent lines are answers (like a) Đúng b) Sai)
    const subsequentAnsLines: string[] = [];
    for (let j = ansIdx + 1; j < lines.length; j++) {
      if (/^[a-d][\)\.]\s*(?:Đúng|Sai|Đ|S)/i.test(lines[j])) {
        subsequentAnsLines.push(lines[j]);
      } else {
        break;
      }
    }
    if (subsequentAnsLines.length > 0) {
      inlineAnswer += ' ' + subsequentAnsLines.join(' ');
      lines.splice(ansIdx, 1 + subsequentAnsLines.length);
    } else {
      lines.splice(ansIdx, 1);
    }
  }

  // Check for True/False statements a), b), c), d) or a., b., c., d.
  const tfIndices: { lineIdx: number; label: 'a' | 'b' | 'c' | 'd'; text: string }[] = [];
  lines.forEach((line, idx) => {
    const tfMatch = /^([a-d])[\)\.]\s*(.*)$/i.exec(line);
    if (tfMatch) {
      tfIndices.push({
        lineIdx: idx,
        label: tfMatch[1].toLowerCase() as 'a' | 'b' | 'c' | 'd',
        text: tfMatch[2].trim(),
      });
    }
  });

  // Check for Multiple Choice options A., B., C., D.
  const mcIndices: { lineIdx: number; label: 'A' | 'B' | 'C' | 'D'; text: string }[] = [];
  lines.forEach((line, idx) => {
    // Avoid matching chemical element formulas or variables inside text
    const mcMatch = /^([A-D])[\.:\)]\s*(.*)$/.exec(line);
    if (mcMatch) {
      mcIndices.push({
        lineIdx: idx,
        label: mcMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D',
        text: mcMatch[2].trim(),
      });
    }
  });

  // Determine question type:
  let type: QuestionType = 'multiple_choice';

  if (partContext === 'PHẦN II' || (tfIndices.length >= 2 && mcIndices.length < 2)) {
    type = 'true_false';
  } else if (partContext === 'PHẦN III' || (mcIndices.length === 0 && tfIndices.length === 0)) {
    type = 'short_answer';
  } else if (mcIndices.length >= 2) {
    type = 'multiple_choice';
  } else if (tfIndices.length > 0) {
    type = 'true_false';
  } else {
    type = 'short_answer';
  }

  // Final solution resolution: bottom solution > inline solution
  const finalExplanation = (bottomSolutions && bottomSolutions[index]) || inlineExplanation || undefined;

  const base = {
    id: `q-imported-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    code: `CH-${index < 10 ? '0' + index : index}`,
    level,
    createdAt: new Date().toISOString(),
    explanation: finalExplanation,
  };

  if (type === 'multiple_choice') {
    let stemEndLine = lines.length;
    if (mcIndices.length > 0) {
      stemEndLine = mcIndices[0].lineIdx;
    }
    const stem = lines.slice(0, stemEndLine).join('\n').trim();

    const options: { id: 'A' | 'B' | 'C' | 'D'; text: string }[] = [];
    for (let o = 0; o < mcIndices.length; o++) {
      const current = mcIndices[o];
      const nextIdx = o < mcIndices.length - 1 ? mcIndices[o + 1].lineIdx : lines.length;
      const optTextLines = [current.text, ...lines.slice(current.lineIdx + 1, nextIdx)];
      options.push({
        id: current.label,
        text: optTextLines.join('\n').trim(),
      });
    }

    // Ensure A, B, C, D present
    const labels: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const completeOptions = labels.map(lbl => {
      const found = options.find(o => o.id === lbl);
      return found || { id: lbl, text: '' };
    });

    if (options.length < 4) {
      warnings.push(`Chỉ nhận diện được ${options.length}/4 phương án`);
    }

    // Resolve Correct Answer
    let correctAnswer: 'A' | 'B' | 'C' | 'D' | undefined = undefined;
    if (inlineAnswer) {
      const ansMatch = /[ABCD]/i.exec(inlineAnswer);
      if (ansMatch) correctAnswer = ansMatch[0].toUpperCase() as any;
    }
    if (!correctAnswer && bottomAnswers?.multipleChoice[index]) {
      correctAnswer = bottomAnswers.multipleChoice[index];
    }
    if (!correctAnswer) {
      warnings.push('Chưa có đáp án chuẩn');
    }

    const q: MultipleChoiceQuestion = {
      ...base,
      type: 'multiple_choice',
      stem: stem || `Câu hỏi ${index}`,
      options: completeOptions,
      correctAnswer,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
    return q;
  }

  if (type === 'true_false') {
    let stemEndLine = lines.length;
    if (tfIndices.length > 0) {
      stemEndLine = tfIndices[0].lineIdx;
    }
    const stem = lines.slice(0, stemEndLine).join('\n').trim();

    const tfLabels: ('a' | 'b' | 'c' | 'd')[] = ['a', 'b', 'c', 'd'];
    const rawStatements: Record<'a' | 'b' | 'c' | 'd', string> = { a: '', b: '', c: '', d: '' };

    for (let t = 0; t < tfIndices.length; t++) {
      const current = tfIndices[t];
      const nextIdx = t < tfIndices.length - 1 ? tfIndices[t + 1].lineIdx : lines.length;
      const stmtTextLines = [current.text, ...lines.slice(current.lineIdx + 1, nextIdx)];
      rawStatements[current.label] = stmtTextLines.join('\n').trim();
    }

    // Parse answers from inline text like: a) Đúng b) Sai c) Đúng d) Sai
    const ansMap: Record<string, boolean> = {};
    if (inlineAnswer) {
      const tfRegex = /([a-d])[\)\.]?\s*(Đúng|Sai|Đ|S|true|false)/gi;
      let m;
      while ((m = tfRegex.exec(inlineAnswer)) !== null) {
        const lbl = m[1].toLowerCase();
        const val = /^(?:Đúng|Đ|true)$/i.test(m[2]);
        ansMap[lbl] = val;
      }
    }
    // Or from bottom answer table
    if (bottomAnswers?.trueFalse[index]) {
      Object.assign(ansMap, bottomAnswers.trueFalse[index]);
    }

    const statements = tfLabels.map(lbl => {
      const hasText = !!rawStatements[lbl];
      if (!hasText) {
        warnings.push(`Thiếu phát biểu ${lbl})`);
      }
      return {
        id: lbl,
        text: rawStatements[lbl] || '',
        correctAnswer: ansMap[lbl] !== undefined ? ansMap[lbl] : undefined,
      };
    });

    const missingAnsCount = statements.filter(s => s.correctAnswer === undefined).length;
    if (missingAnsCount > 0) {
      warnings.push(`Chưa có đủ đáp án đúng/sai (${4 - missingAnsCount}/4)`);
    }

    const q: TrueFalseQuestion = {
      ...base,
      type: 'true_false',
      stem: stem || `Câu hỏi ${index}`,
      statements,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
    return q;
  }

  // Short answer
  const stem = lines.join('\n').trim();
  let correctAnswer = inlineAnswer || (bottomAnswers?.shortAnswer[index] ? bottomAnswers.shortAnswer[index] : '');
  if (!correctAnswer) {
    warnings.push('Chưa có đáp án chuẩn cho câu trả lời ngắn');
  }

  const q: ShortAnswerQuestion = {
    ...base,
    type: 'short_answer',
    stem: stem || `Câu hỏi ${index}`,
    correctAnswer: correctAnswer || undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
  return q;
}

interface BottomAnswersMap {
  multipleChoice: Record<number, 'A' | 'B' | 'C' | 'D'>;
  trueFalse: Record<number, Record<'a' | 'b' | 'c' | 'd', boolean>>;
  shortAnswer: Record<number, string>;
}

function parseAnswerSection(answerText: string): BottomAnswersMap {
  const result: BottomAnswersMap = {
    multipleChoice: {},
    trueFalse: {},
    shortAnswer: {},
  };

  if (!answerText) return result;

  // 1. Multiple choice table or list:
  // e.g. "1 [BIẾT] C" or "Câu 1: C" or "1: C" or "1 C"
  const mcPattern = /(?:Câu\s*)?(\d+)\s*(?:\[[^\]]+\]\s*)?([A-D])\b/gi;
  let mcMatch;
  while ((mcMatch = mcPattern.exec(answerText)) !== null) {
    const qNum = parseInt(mcMatch[1], 10);
    const ans = mcMatch[2].toUpperCase() as 'A' | 'B' | 'C' | 'D';
    result.multipleChoice[qNum] = ans;
  }

  // 2. True False table:
  // e.g.
  // Lệnh hỏi Câu 1 Câu 2
  // a) Đ S
  // b) Đ Đ
  // c) S Đ
  // d) Đ S
  const tfLines = answerText.split('\n').map(l => l.trim()).filter(Boolean);
  const tfRowRegex = /^([a-d])[\)\.]\s*(.*)$/i;

  // Check if there is a header with "Câu 1 Câu 2"
  let targetQuestions = [1, 2, 3, 4];
  for (const line of tfLines) {
    if (line.includes('Lệnh hỏi') || line.includes('Câu 1')) {
      const qNums = Array.from(line.matchAll(/Câu\s*(\d+)/gi)).map(m => parseInt(m[1], 10));
      if (qNums.length > 0) targetQuestions = qNums;
    }
    const rowMatch = tfRowRegex.exec(line);
    if (rowMatch) {
      const label = rowMatch[1].toLowerCase() as 'a' | 'b' | 'c' | 'd';
      const answers = rowMatch[2].split(/\s+/).filter(Boolean);
      answers.forEach((ans, idx) => {
        const qNum = targetQuestions[idx] || (idx + 1);
        if (!result.trueFalse[qNum]) {
          result.trueFalse[qNum] = {} as any;
        }
        result.trueFalse[qNum][label] = /^(?:Đ|Đúng|T|True)$/i.test(ans);
      });
    }
  }

  // 3. Short answer table:
  // e.g.
  // Câu Mức độ Đáp án
  // 1 [VẬN DỤNG] 33
  // 2 [VẬN DỤNG CAO] 5
  const saPattern = /(?:PHẦN\s*III|TRẢ\s*LỜI\s*NGẮN)[\s\S]*?(?:Câu[\s\S]*?)(?=(?:HƯỚNG\s*DẪN|$))/i;
  const saSection = saPattern.exec(answerText);
  if (saSection) {
    const saLines = saSection[0].split('\n');
    for (const line of saLines) {
      const row = /^(\d+)\s*(?:\[[^\]]+\]\s*)?([^\s].*)$/.exec(line.trim());
      if (row && !isNaN(parseInt(row[1], 10))) {
        const qNum = parseInt(row[1], 10);
        result.shortAnswer[qNum] = row[2].trim();
      }
    }
  }

  return result;
}

function parseSolutionSection(solutionText: string): Record<number, string> {
  const result: Record<number, string> = {};
  if (!solutionText) return result;

  const solRegex = /(?:^|\n)\s*Câu\s*(\d+)[\.:\s]*([\s\S]*?)(?=(?:(?:\n\s*Câu\s*\d+[\.:\s])|$))/gi;
  let match;
  while ((match = solRegex.exec(solutionText)) !== null) {
    const qNum = parseInt(match[1], 10);
    const content = match[2].trim();
    result[qNum] = content;
  }

  return result;
}
