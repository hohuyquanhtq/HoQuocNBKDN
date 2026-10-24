import { User, Question, Exam, ExamSubmission } from '../types/index.ts';

const STORAGE_KEYS = {
  USERS: 'educhem_users_v1',
  CURRENT_USER: 'educhem_current_user_v1',
  QUESTIONS: 'educhem_questions_v1',
  EXAMS: 'educhem_exams_v1',
  SUBMISSIONS: 'educhem_submissions_v1',
};

const SALT = 'educhem_salt_2025_sec_';

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(SALT + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initial seed questions based on Vietnamese GDPT 2018 Chemistry curriculum
const SEED_QUESTIONS: Question[] = [
  {
    id: 'ch-mc-01',
    code: 'CH-TN-01',
    type: 'multiple_choice',
    level: 'BIẾT',
    topic: 'Cân bằng hóa học',
    stem: 'Một phản ứng thuận nghịch đạt trạng thái cân bằng hóa học khi',
    options: [
      { id: 'A', text: 'phản ứng thuận đã dừng lại hoàn toàn.' },
      { id: 'B', text: 'nồng độ của các chất phản ứng bằng nồng độ của các sản phẩm.' },
      { id: 'C', text: 'tốc độ của phản ứng thuận bằng tốc độ của phản ứng nghịch.' },
      { id: 'D', text: 'khối lượng các chất tham gia phản ứng bằng khối lượng các chất tạo thành.' },
    ],
    correctAnswer: 'C',
    explanation: 'Cân bằng hoá học là trạng thái của phản ứng thuận nghịch khi tốc độ phản ứng thuận bằng tốc độ phản ứng nghịch (vt = vn).',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ch-mc-02',
    code: 'CH-TN-02',
    type: 'multiple_choice',
    level: 'BIẾT',
    topic: 'Cân bằng hóa học',
    stem: 'Biểu thức hằng số cân bằng KC của phản ứng thuận nghịch: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) là',
    options: [
      { id: 'A', text: 'KC = [NH₃]² / ([N₂] · [H₂]³)' },
      { id: 'B', text: 'KC = ([N₂] · [H₂]³) / [NH₃]²' },
      { id: 'C', text: 'KC = 2[NH₃] / ([N₂] + 3[H₂])' },
      { id: 'D', text: 'KC = [NH₃] / ([N₂] · [H₂])' },
    ],
    correctAnswer: 'A',
    explanation: 'Biểu thức hằng số cân bằng KC của phản ứng aA + bB ⇌ cC + dD là KC = ([C]^c · [D]^d) / ([A]^a · [B]^b). Do đó KC = [NH₃]² / ([N₂] · [H₂]³).',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ch-mc-03',
    code: 'CH-TN-03',
    type: 'multiple_choice',
    level: 'HIỂU',
    topic: 'Cân bằng hóa học',
    stem: 'Cho cân bằng hóa học sau trong bình kín: CaCO₃(s) ⇌ CaO(s) + CO₂(g)  Δr H°₂₉₈ > 0. Biện pháp nào sau đây làm cân bằng chuyển dịch theo chiều thuận?',
    options: [
      { id: 'A', text: 'Tăng áp suất chung của hệ phản ứng.' },
      { id: 'B', text: 'Tăng nhiệt độ của hệ phản ứng.' },
      { id: 'C', text: 'Thêm một lượng chất rắn CaCO₃ vào bình.' },
      { id: 'D', text: 'Giảm thể tích của bình phản ứng.' },
    ],
    correctAnswer: 'B',
    explanation: 'Phản ứng có Δr H°₂₉₈ > 0 là phản ứng thu nhiệt. Theo nguyên lý Le Chatelier, khi tăng nhiệt độ, cân bằng chuyển dịch theo chiều thu nhiệt (chiều thuận).',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ch-mc-04',
    code: 'CH-TN-04',
    type: 'multiple_choice',
    level: 'HIỂU',
    topic: 'Cân bằng hóa học',
    stem: 'Cho cân bằng hóa học: 2SO₂(g) + O₂(g) ⇌ 2SO₃(g)  Δr H°₂₉₈ = -197 kJ. Phát biểu nào sau đây sai?',
    options: [
      { id: 'A', text: 'Khi tăng nhiệt độ, cân bằng chuyển dịch theo chiều nghịch.' },
      { id: 'B', text: 'Khi tăng áp suất của hệ, hiệu suất phản ứng tạo SO₃ tăng.' },
      { id: 'C', text: 'Chất xúc tác V₂O₅ làm tăng tốc độ đạt trạng thái cân bằng nhưng không làm chuyển dịch cân bằng.' },
      { id: 'D', text: 'Khi tăng nồng độ O₂, hằng số cân bằng KC của phản ứng tăng lên.' },
    ],
    correctAnswer: 'D',
    explanation: 'Hằng số cân bằng KC chỉ phụ thuộc vào bản chất phản ứng và nhiệt độ, không phụ thuộc vào nồng độ các chất.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ch-tf-01',
    code: 'CH-DS-01',
    type: 'true_false',
    level: 'HIỂU',
    topic: 'Cân bằng hóa học',
    stem: 'Trong công nghiệp, ammonia (NH₃) được tổng hợp theo quá trình Haber – Bosch qua phản ứng thuận nghịch: N₂(g) + 3H₂(g) ⇌ 2NH₃(g)  Δr H°₂₉₈ = -91,8 kJ. Quá trình sản xuất thường được thực hiện ở nhiệt độ khoảng 400 °C – 450 °C, áp suất 150 – 200 bar với xúc tác sắt phủ oxide nhôm và kali.',
    statements: [
      {
        id: 'a',
        text: 'Phản ứng tổng hợp NH₃ là phản ứng tỏa nhiệt, do đó khi hạ nhiệt độ phản ứng, cân bằng sẽ chuyển dịch theo chiều thuận.',
        correctAnswer: true,
        explanation: 'Đúng. Δr H°₂₉₈ < 0 (tỏa nhiệt), giảm nhiệt độ làm cân bằng chuyển dịch theo chiều tỏa nhiệt (chiều thuận).',
      },
      {
        id: 'b',
        text: 'Việc tăng áp suất của hệ phản ứng vừa làm tăng tốc độ phản ứng, vừa làm cân bằng chuyển dịch theo chiều thuận giúp tăng hiệu suất tạo NH₃.',
        correctAnswer: true,
        explanation: 'Đúng. Tăng áp suất làm tăng nồng độ chất phản ứng khí → tăng tốc độ; đồng thời chuyển dịch theo chiều giảm số mol khí (4 mol → 2 mol) là chiều thuận.',
      },
      {
        id: 'c',
        text: 'Khi nồng độ N₂ và H₂ tăng gấp đôi thì giá trị hằng số cân bằng KC của phản ứng sẽ tăng lên.',
        correctAnswer: false,
        explanation: 'Sai. KC chỉ phụ thuộc vào nhiệt độ và bản chất phản ứng, không đổi khi thay đổi nồng độ.',
      },
      {
        id: 'd',
        text: 'Trong thực tế, người ta không chọn nhiệt độ quá thấp (dù có lợi về chuyển dịch cân bằng) vì ở nhiệt độ thấp tốc độ phản ứng diễn ra quá chậm.',
        correctAnswer: true,
        explanation: 'Đúng. Ở nhiệt độ thấp, tốc độ phản ứng quá chậm, chất xúc tác kém hoạt động nên cần nhiệt độ tối ưu 400 – 450 °C.',
      },
    ],
    explanation: 'Chi tiết từng ý được phân tích dựa trên nguyên lý Le Chatelier và các yếu tố ảnh hưởng tốc độ phản ứng.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ch-tf-02',
    code: 'CH-DS-02',
    type: 'true_false',
    level: 'VẬN DỤNG CAO',
    topic: 'Cân bằng hóa học',
    stem: 'Ở 25 °C, xét hệ cân bằng trong bình kín dung tích 1,0 L không đổi: N₂O₄(g) (không màu) ⇌ 2NO₂(g) (nâu đỏ)  Δr H°₂₉₈ = 57,2 kJ. Ban đầu nạp vào bình 0,05 mol N₂O₄. Khi hệ đạt trạng thái cân bằng ở 25 °C, phân tích thấy có 0,02 mol NO₂ được tạo thành.',
    statements: [
      {
        id: 'a',
        text: 'Phản ứng thuận là phản ứng thu nhiệt, do đó khi ngâm bình vào chậu nước đá thì màu nâu đỏ của khí trong bình sẽ đậm dần lên.',
        correctAnswer: false,
        explanation: 'Sai. Ngâm nước đá là hạ nhiệt độ → cân bằng chuyển dịch theo chiều tỏa nhiệt (chiều nghịch, tạo N₂O₄ không màu) → màu nhạt dần.',
      },
      {
        id: 'b',
        text: 'Nồng độ của N₂O₄ ở trạng thái cân bằng là 0,04 M.',
        correctAnswer: true,
        explanation: 'Đúng. n(N₂O₄ phản ứng) = 1/2 n(NO₂) = 0,01 mol => n(N₂O₄ cb) = 0,05 - 0,01 = 0,04 mol trong bình 1L => [N₂O₄] = 0,04 M.',
      },
      {
        id: 'c',
        text: 'Hằng số cân bằng KC của phản ứng ở 25 °C có giá trị bằng 0,01.',
        correctAnswer: true,
        explanation: 'Đúng. KC = [NO₂]² / [N₂O₄] = 0,02² / 0,04 = 0,0004 / 0,04 = 0,01.',
      },
      {
        id: 'd',
        text: 'Nếu giữ nguyên nhiệt độ và nạp thêm vào bình 0,02 mol NO₂, cân bằng sẽ chuyển dịch theo chiều nghịch và tại trạng thái cân bằng mới, nồng độ của NO₂ sẽ nhỏ hơn 0,02 M.',
        correctAnswer: false,
        explanation: 'Sai. Thêm NO₂, cân bằng chuyển dịch theo chiều nghịch làm giảm nồng độ NO₂ thêm vào, nhưng nồng độ mới vẫn lớn hơn nồng độ ban đầu (> 0,02 M).',
      },
    ],
    explanation: 'Áp dụng định luật tác dụng khối lượng tính KC = 0,01 và nguyên lý Le Chatelier.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ch-sa-01',
    code: 'CH-TLN-01',
    type: 'short_answer',
    level: 'VẬN DỤNG',
    topic: 'Cân bằng hóa học',
    stem: 'Cho phản ứng thuận nghịch: CO(g) + H₂O(g) ⇌ CO₂(g) + H₂(g). Ở nhiệt độ T, hằng số cân bằng KC = 4. Ban đầu nạp vào bình kín 1 mol CO và 1 mol H₂O. Khi phản ứng đạt trạng thái cân bằng ở nhiệt độ T, nồng độ phần trăm về thể tích của khí CO₂ trong hỗn hợp sau phản ứng là bao nhiêu phần trăm? (Làm tròn kết quả đến hàng đơn vị).',
    correctAnswer: '33',
    acceptableAnswers: ['33', '33%', '33.33', '33,33'],
    tolerance: 0.5,
    explanation: 'Gọi x là số mol CO phản ứng. Tại cb: n(CO) = 1-x, n(H₂O) = 1-x, n(CO₂) = x, n(H₂) = x. KC = x²/(1-x)² = 4 => x/(1-x) = 2 => x = 2/3 mol. Tổng mol khí = 2 mol. %V(CO₂) = (2/3)/2 * 100% ≈ 33%.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ch-sa-02',
    code: 'CH-TLN-02',
    type: 'short_answer',
    level: 'VẬN DỤNG CAO',
    topic: 'Cân bằng hóa học',
    stem: 'Ở 850 °C, hằng số cân bằng của phản ứng tổng hợp phosgene là KC: CO(g) + Cl₂(g) ⇌ COCl₂(g). Nạp vào bình kín dung tích 2,0 L hỗn hợp gồm 0,8 mol CO và 0,6 mol Cl₂. Giữ bình ở 850 °C cho đến khi cân bằng được thiết lập, thấy có 0,4 mol COCl₂ được tạo thành. Giá trị của hằng số cân bằng KC ở nhiệt độ này bằng bao nhiêu?',
    correctAnswer: '5',
    acceptableAnswers: ['5', '5.0', '5,0'],
    tolerance: 0.1,
    explanation: 'V = 2,0 L. Tại cb: [COCl₂] = 0,4/2 = 0,2 M; n(CO) = 0,8 - 0,4 = 0,4 mol => [CO] = 0,2 M; n(Cl₂) = 0,6 - 0,4 = 0,2 mol => [Cl₂] = 0,1 M. KC = [COCl₂] / ([CO] · [Cl₂]) = 0,2 / (0,2 · 0,1) = 5.',
    createdAt: new Date().toISOString(),
  },
];

const SEED_EXAM: Exam = {
  id: 'exam-can-bang-hoa-hoc-11',
  title: 'Đề kiểm tra Hóa học 11 - Chủ đề Cân bằng hóa học (GDPT 2018)',
  description: 'Gồm 3 phần: Trắc nghiệm 4 lựa chọn, Đúng/Sai với 4 phát biểu và Trả lời ngắn.',
  timeLimitMinutes: 20,
  totalPoints: 10.0,
  questions: SEED_QUESTIONS,
  createdAt: new Date().toISOString(),
  createdBy: 'user-gv-1',
  isPublished: true,
};

export async function initializeStorage(): Promise<void> {
  // Check users
  const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!rawUsers) {
    const gvPassHash = await hashPassword('educhem2025@');
    const hsPassHash = await hashPassword('hocsinh2025@');

    const defaultUsers: User[] = [
      {
        id: 'user-gv-1',
        username: 'gv_hoahoc',
        role: 'GV',
        fullName: 'ThS. Nguyễn Văn Minh',
        email: 'nguyenvanminh@educhem.edu.vn',
        phoneNumber: '0912345678',
        passwordHash: gvPassHash,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user-hs-1',
        username: 'hs_lananh',
        role: 'HS',
        fullName: 'Trần Thị Lan Anh',
        className: '11A1',
        email: 'lananh.tran@school.edu.vn',
        passwordHash: hsPassHash,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  // Check questions
  const rawQuestions = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
  if (!rawQuestions) {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(SEED_QUESTIONS));
  }

  // Check exams
  const rawExams = localStorage.getItem(STORAGE_KEYS.EXAMS);
  if (!rawExams) {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([SEED_EXAM]));
  }
}

// User methods
export function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function registerUser(data: {
  username: string;
  role: 'GV' | 'HS';
  fullName: string;
  password: string;
  email?: string;
  className?: string;
  phoneNumber?: string;
}): Promise<{ success: boolean; error?: string; user?: User }> {
  const users = getUsers();
  const cleanUsername = data.username.trim().toLowerCase();

  if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: 'Tên đăng nhập đã tồn tại trong hệ thống.' };
  }

  const passwordHash = await hashPassword(data.password);
  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    username: cleanUsername,
    role: data.role,
    fullName: data.fullName.trim(),
    email: data.email?.trim() || undefined,
    className: data.role === 'HS' ? (data.className?.trim() || undefined) : undefined,
    phoneNumber: data.phoneNumber?.trim() || undefined,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  return { success: true, user: newUser };
}

export async function loginUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
  const users = getUsers();
  const cleanUsername = username.trim().toLowerCase();
  const user = users.find(u => u.username.toLowerCase() === cleanUsername);

  if (!user) {
    return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
  }

  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
  }

  setCurrentUser(user);
  return { success: true, user };
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

export function clearCurrentUser(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

export async function updateUserProfile(userId: string, data: {
  fullName: string;
  email?: string;
  className?: string;
  phoneNumber?: string;
}): Promise<User | null> {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;

  users[idx] = {
    ...users[idx],
    fullName: data.fullName.trim(),
    email: data.email?.trim() || undefined,
    className: users[idx].role === 'HS' ? (data.className?.trim() || undefined) : undefined,
    phoneNumber: data.phoneNumber?.trim() || undefined,
  };

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser(users[idx]);
  }
  return users[idx];
}

export async function changeUserPassword(userId: string, oldPass: string, newPass: string): Promise<{ success: boolean; error?: string }> {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false, error: 'Người dùng không tồn tại.' };

  const oldHash = await hashPassword(oldPass);
  if (users[idx].passwordHash !== oldHash) {
    return { success: false, error: 'Mật khẩu hiện tại không chính xác.' };
  }

  users[idx].passwordHash = await hashPassword(newPass);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser(users[idx]);
  }
  return { success: true };
}

// Question methods
export function getQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQuestion(question: Question): void {
  const list = getQuestions();
  const idx = list.findIndex(q => q.id === question.id);
  if (idx >= 0) {
    list[idx] = question;
  } else {
    list.unshift(question);
  }
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(list));
}

export function saveMultipleQuestions(newQuestions: Question[]): void {
  const list = getQuestions();
  // Filter out any duplicates by ID
  const existingIds = new Set(list.map(q => q.id));
  const toAdd = newQuestions.filter(q => !existingIds.has(q.id));
  const updated = [...toAdd, ...list];
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updated));
}

export function deleteQuestion(id: string): void {
  const list = getQuestions().filter(q => q.id !== id);
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(list));
}

// Exam methods
export function getExams(): Exam[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getExamById(id: string): Exam | undefined {
  return getExams().find(e => e.id === id);
}

export function saveExam(exam: Exam): void {
  const list = getExams();
  const idx = list.findIndex(e => e.id === exam.id);
  if (idx >= 0) {
    list[idx] = exam;
  } else {
    list.unshift(exam);
  }
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(list));
}

export function deleteExam(id: string): void {
  const list = getExams().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(list));
}

// Submission methods
export function getSubmissions(): ExamSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getSubmissionById(id: string): ExamSubmission | undefined {
  return getSubmissions().find(s => s.id === id);
}

export function getSubmissionsByStudent(studentId: string): ExamSubmission[] {
  return getSubmissions().filter(s => s.studentId === studentId);
}

export function getSubmissionsByExam(examId: string): ExamSubmission[] {
  return getSubmissions().filter(s => s.examId === examId);
}

export function saveSubmission(submission: ExamSubmission): void {
  const list = getSubmissions();
  // Avoid duplicate submissions for the same submission ID
  const idx = list.findIndex(s => s.id === submission.id);
  if (idx >= 0) {
    list[idx] = submission;
  } else {
    list.unshift(submission);
  }
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list));
}
