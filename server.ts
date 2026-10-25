import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Port 3000 is required by the environment; ignore container-level PORT=8080 used by Nginx
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// CORS & Preflight handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Database directory & file path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read DB
interface DatabaseSchema {
  users: any[];
  exams: any[];
  submissions: any[];
  questions: any[];
}

function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        exams: Array.isArray(parsed.exams) ? parsed.exams : [],
        submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      };
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  return { users: [], exams: [], submissions: [], questions: [] };
}

// Helper to write DB
function writeDb(data: DatabaseSchema): void {
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
    users: dbData.users || [],
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
    submissions: dbData.submissions || [],
    questions: dbData.questions || [],
  });
}

// --- API ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// --- USER & AUTH ROUTES (SHARED ACROSS DEVICES) ---
app.get('/api/users', (req, res) => {
  const db = readDb();
  // Return users with safe public data
  const safeUsers = (db.users || []).map(({ passwordHash, ...safe }) => safe);
  res.json(safeUsers);
});

app.post('/api/users/sync', (req, res) => {
  const db = readDb();
  const { users } = req.body;
  if (Array.isArray(users)) {
    const existingMap = new Map((db.users || []).map((u: any) => [u.id, u]));
    for (const u of users) {
      if (u.id && !existingMap.has(u.id)) {
        existingMap.set(u.id, u);
      }
    }
    db.users = Array.from(existingMap.values());
    writeDb(db);
  }
  res.json({ success: true, count: (db.users || []).length });
});

app.post('/api/users/register', (req, res) => {
  const db = readDb();
  const newUser = req.body;
  if (!newUser.username || !newUser.passwordHash || !newUser.role) {
    return res.status(400).json({ error: 'Thiếu thông tin đăng ký bắt buộc.' });
  }

  const cleanUsername = newUser.username.trim().toLowerCase();
  const exists = (db.users || []).some(
    (u: any) => u.username && u.username.toLowerCase() === cleanUsername
  );
  if (exists) {
    return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại trong hệ thống.' });
  }

  db.users = db.users || [];
  db.users.push(newUser);
  writeDb(db);

  const { passwordHash, ...safeUser } = newUser;
  res.json({ success: true, user: safeUser });
});

app.post('/api/users/login', (req, res) => {
  const db = readDb();
  const { username, passwordHash } = req.body;
  if (!username || !passwordHash) {
    return res.status(400).json({ error: 'Thiếu thông tin đăng nhập.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const user = (db.users || []).find(
    (u: any) => u.username && u.username.toLowerCase() === cleanUsername
  );

  if (!user || user.passwordHash !== passwordHash) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// --- EXAM ROUTES ---

// GET all exams or query by code/id
app.get('/api/exams', (req, res) => {
  const db = readDb();
  const { code, id, examCode, examId } = req.query;
  const searchCode = ((code || examCode) as string | undefined)?.trim();
  const searchId = ((id || examId) as string | undefined)?.trim();

  if (searchCode) {
    const upper = searchCode.toUpperCase();
    const found = (db.exams || []).find((e: any) => e.code && e.code.trim().toUpperCase() === upper);
    if (!found) {
      return res.status(404).json({ error: 'Không tìm thấy bài thi với mã này.' });
    }
    return res.json(found);
  }

  if (searchId) {
    const found = (db.exams || []).find((e: any) => e.id === searchId || e.examId === searchId);
    if (!found) {
      return res.status(404).json({ error: 'Không tìm thấy bài thi với ID này.' });
    }
    return res.json(found);
  }

  res.json(db.exams || []);
});

// GET exam by code or id (supports students opening link from any device/browser)
app.get('/api/exams/:codeOrId', (req, res) => {
  const db = readDb();
  const rawParam = (req.params.codeOrId || '').trim();
  const upperSearch = rawParam.toUpperCase();

  const exam = (db.exams || []).find(
    (e: any) =>
      (e.code && e.code.trim().toUpperCase() === upperSearch) ||
      (e.id && e.id.trim().toUpperCase() === upperSearch) ||
      (e.id && e.id.trim() === rawParam) ||
      (e.examId && e.examId.trim() === rawParam)
  );

  if (!exam) {
    return res.status(404).json({ error: 'Không tìm thấy bài thi với mã này.' });
  }

  res.json(exam);
});

// Handler for saving/updating exams supporting multiple routes and methods
function handleSaveExam(req: express.Request, res: express.Response) {
  try {
    const db = readDb();
    const newExam = req.body;

    if (!newExam || typeof newExam !== 'object') {
      return res.status(400).json({ error: 'Dữ liệu gửi lên không đúng định dạng JSON.' });
    }

    const examId = newExam.id || newExam.examId || (req.params && req.params.id);
    if (!examId) {
      return res.status(400).json({ error: 'Thiếu mã định danh của đề thi (id/examId).' });
    }
    if (!newExam.title || typeof newExam.title !== 'string' || !newExam.title.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đề thi hợp lệ.' });
    }

    newExam.id = examId;
    newExam.examId = examId;

    // Normalize exam fields for full cross-system compatibility
    if (!newExam.code) {
      newExam.code = `CHEM-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    if (!newExam.status) {
      newExam.status = newExam.isPublished ? 'open' : 'draft';
    }
    newExam.updatedAt = new Date().toISOString();
    if (!newExam.createdAt) {
      newExam.createdAt = newExam.updatedAt;
    }
    if (newExam.isPublished && !newExam.publishedAt) {
      newExam.publishedAt = newExam.updatedAt;
    }
    if (newExam.shareEnabled === undefined) {
      newExam.shareEnabled = true;
    }
    if (!newExam.ownerId && newExam.createdBy) {
      newExam.ownerId = newExam.createdBy;
    }

    db.exams = db.exams || [];
    const existingIdx = db.exams.findIndex((e: any) => e.id === examId || (e.code && e.code === newExam.code));
    if (existingIdx >= 0) {
      db.exams[existingIdx] = { ...db.exams[existingIdx], ...newExam };
    } else {
      db.exams.unshift(newExam);
    }

    writeDb(db);
    return res.status(200).json({ success: true, exam: newExam });
  } catch (err: any) {
    console.error('Error saving exam:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ khi ghi dữ liệu đề thi vào cơ sở dữ liệu.' });
  }
}

// Support POST & PUT on /api/exams and subpaths
app.post('/api/exams', handleSaveExam);
app.post('/api/exams/:id', handleSaveExam);
app.put('/api/exams', handleSaveExam);
app.put('/api/exams/:id', handleSaveExam);

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

// Explicit JSON 404 handler for any unhandled /api/* endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: `Đường dẫn API '${req.method} ${req.path}' không tồn tại trên máy chủ.`,
  });
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
