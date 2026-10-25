import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));

// Database directory & file path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read DB
function readDb(): { exams: any[]; submissions: any[]; questions: any[] } {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  return { exams: [], submissions: [], questions: [] };
}

// Helper to write DB
function writeDb(data: { exams: any[]; submissions: any[]; questions: any[] }): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

// Initialize seed data if empty
const dbData = readDb();
if (!dbData.exams || dbData.exams.length === 0) {
  writeDb({
    exams: [
      {
        id: 'exam-can-bang-hoa-hoc-11',
        code: 'CHEM-2025-01',
        title: 'Đề kiểm tra Hóa học 11 - Chủ đề Cân bằng hóa học (GDPT 2018)',
        subject: 'Hóa học',
        topic: 'Cân bằng hóa học',
        targetGrade: 'Lớp 11',
        description: 'Gồm 3 phần: Trắc nghiệm 4 lựa chọn, Đúng/Sai với 4 phát biểu và Trả lời ngắn.',
        timeLimitMinutes: 20,
        totalPoints: 10.0,
        questions: [],
        createdAt: new Date().toISOString(),
        createdBy: 'user-gv-1',
        isPublished: true,
        status: 'open',
        shuffleQuestions: false,
        shuffleOptions: false,
        publishScoreMode: 'immediately',
        allowReviewAfterSubmit: true,
        startedCount: 0,
        submittedCount: 0,
      },
    ],
    submissions: [],
    questions: [],
  });
}

// --- API ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// GET all exams
app.get('/api/exams', (req, res) => {
  const db = readDb();
  res.json(db.exams || []);
});

// GET exam by code or id (supports students opening link from any device)
app.get('/api/exams/:codeOrId', (req, res) => {
  const db = readDb();
  const search = req.params.codeOrId.trim().toUpperCase();
  const exam = (db.exams || []).find(
    (e: any) => (e.code && e.code.toUpperCase() === search) || e.id === req.params.codeOrId
  );

  if (!exam) {
    return res.status(404).json({ error: 'Không tìm thấy bài thi với mã này.' });
  }

  res.json(exam);
});

// POST save / update exam
app.post('/api/exams', (req, res) => {
  const db = readDb();
  const newExam = req.body;

  if (!newExam.id || !newExam.title) {
    return res.status(400).json({ error: 'Dữ liệu đề thi không hợp lệ.' });
  }

  const existingIdx = (db.exams || []).findIndex((e: any) => e.id === newExam.id);
  if (existingIdx >= 0) {
    db.exams[existingIdx] = { ...db.exams[existingIdx], ...newExam };
  } else {
    db.exams.unshift(newExam);
  }

  writeDb(db);
  res.json({ success: true, exam: newExam });
});

// PATCH toggle exam status (open / closed / draft)
app.patch('/api/exams/:id/status', (req, res) => {
  const db = readDb();
  const exam = (db.exams || []).find((e: any) => e.id === req.params.id);
  if (!exam) {
    return res.status(404).json({ error: 'Đề thi không tồn tại.' });
  }

  const { status, isPublished } = req.body;
  if (status !== undefined) exam.status = status;
  if (isPublished !== undefined) exam.isPublished = isPublished;

  writeDb(db);
  res.json({ success: true, exam });
});

// POST increment started student count
app.post('/api/exams/:id/start', (req, res) => {
  const db = readDb();
  const exam = (db.exams || []).find((e: any) => e.id === req.params.id);
  if (exam) {
    exam.startedCount = (exam.startedCount || 0) + 1;
    writeDb(db);
  }
  res.json({ success: true });
});

// DELETE exam
app.delete('/api/exams/:id', (req, res) => {
  const db = readDb();
  db.exams = (db.exams || []).filter((e: any) => e.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

// GET all submissions
app.get('/api/submissions', (req, res) => {
  const db = readDb();
  const { examId, studentId, examCode } = req.query;
  let list = db.submissions || [];

  if (examId) list = list.filter((s: any) => s.examId === examId);
  if (examCode) list = list.filter((s: any) => s.examCode === examCode);
  if (studentId) list = list.filter((s: any) => s.studentId === studentId);

  res.json(list);
});

// POST save submission
app.post('/api/submissions', (req, res) => {
  const db = readDb();
  const sub = req.body;

  if (!sub.id || !sub.examId) {
    return res.status(400).json({ error: 'Dữ liệu bài nộp không hợp lệ.' });
  }

  // Prevent duplicate submissions for same submission ID
  const existingIdx = (db.submissions || []).findIndex((s: any) => s.id === sub.id);
  if (existingIdx >= 0) {
    db.submissions[existingIdx] = sub;
  } else {
    db.submissions.unshift(sub);

    // Increment submitted count on exam
    const exam = (db.exams || []).find((e: any) => e.id === sub.examId);
    if (exam) {
      exam.submittedCount = (exam.submittedCount || 0) + 1;
    }
  }

  writeDb(db);
  res.json({ success: true, submission: sub });
});

// GET questions bank
app.get('/api/questions', (req, res) => {
  const db = readDb();
  res.json(db.questions || []);
});

// POST save questions bank batch
app.post('/api/questions', (req, res) => {
  const db = readDb();
  const { questions } = req.body;
  if (Array.isArray(questions)) {
    const existingIds = new Set((db.questions || []).map((q: any) => q.id));
    const toAdd = questions.filter((q: any) => !existingIds.has(q.id));
    db.questions = [...toAdd, ...(db.questions || [])];
    writeDb(db);
  }
  res.json({ success: true, total: (db.questions || []).length });
});

// Mount Vite middleware in dev mode or serve static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduChem Studio server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start EduChem Studio server:', err);
});
