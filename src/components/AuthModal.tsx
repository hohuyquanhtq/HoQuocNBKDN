import React, { useState } from 'react';
import { User, UserRole } from '../types/index.ts';
import { loginUser, registerUser } from '../services/storage.ts';
import { Eye, EyeOff, Lock, User as UserIcon, Mail, BookOpen, Phone, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>('HS');

  // Form fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [className, setClassName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!username.trim()) {
      errs.username = 'Vui lòng nhập tên đăng nhập.';
    } else if (username.length < 3) {
      errs.username = 'Tên đăng nhập phải có ít nhất 3 ký tự.';
    }

    if (!password) {
      errs.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 8) {
      errs.password = 'Mật khẩu phải có tối thiểu 8 ký tự.';
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        errs.fullName = role === 'GV' ? 'Vui lòng nhập họ và tên giáo viên.' : 'Vui lòng nhập họ và tên học sinh.';
      }

      if (password !== confirmPassword) {
        errs.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
      }

      if (email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          errs.email = 'Định dạng email không hợp lệ.';
        }
      }

      if (phoneNumber.trim()) {
        const phoneRegex = /^[0-9+() -]{8,15}$/;
        if (!phoneRegex.test(phoneNumber.trim())) {
          errs.phoneNumber = 'Số điện thoại không đúng định dạng.';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (mode === 'login') {
        const res = await loginUser(username, password);
        if (res.success && res.user) {
          onSuccess(res.user);
          onClose();
        } else {
          setErrors({ form: res.error || 'Đăng nhập không thành công.' });
        }
      } else {
        const res = await registerUser({
          username,
          role,
          fullName,
          password,
          email: email.trim() || undefined,
          className: role === 'HS' ? (className.trim() || undefined) : undefined,
          phoneNumber: phoneNumber.trim() || undefined,
        });

        if (res.success && res.user) {
          onSuccess(res.user);
          onClose();
        } else {
          setErrors({ form: res.error || 'Đăng ký không thành công.' });
        }
      }
    } catch {
      setErrors({ form: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {mode === 'login' ? 'Đăng nhập EduChem Studio' : 'Tạo tài khoản mới'}
            </h2>
            <p className="text-xs text-emerald-100 mt-1">
              {mode === 'login'
                ? 'Nhập thông tin tài khoản Giáo viên hoặc Học sinh để tiếp tục'
                : 'Đăng ký tài khoản để quản lý câu hỏi hoặc làm bài kiểm tra'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto">
          {/* Quick preset credentials helper */}
          {mode === 'login' && (
            <div className="mb-5 p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200/80 text-xs text-emerald-900">
              <div className="font-semibold flex items-center gap-1.5 text-emerald-800 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Tài khoản mẫu có sẵn:
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setUsername('gv_hoahoc');
                    setPassword('educhem2025@');
                  }}
                  className="text-left p-1.5 rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                >
                  <span className="font-semibold block text-emerald-700">Giáo viên:</span>
                  <span className="text-slate-600">gv_hoahoc</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('hs_lananh');
                    setPassword('hocsinh2025@');
                  }}
                  className="text-left p-1.5 rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                >
                  <span className="font-semibold block text-emerald-700">Học sinh:</span>
                  <span className="text-slate-600">hs_lananh</span>
                </button>
              </div>
            </div>
          )}

          {errors.form && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Vai trò của bạn <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('HS')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                      role === 'HS'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Học sinh (HS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('GV')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                      role === 'GV'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Giáo viên (GV)
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên đăng nhập <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: gv_minh hoặc hs_quang"
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                    errors.username ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300 focus:border-emerald-500'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              {errors.username && <p className="text-xs text-rose-500 mt-1">{errors.username}</p>}
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {role === 'GV' ? 'Họ và tên giáo viên' : 'Họ và tên học sinh'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === 'GV' ? 'Ví dụ: ThS. Hoàng Văn Nam' : 'Ví dụ: Nguyễn Văn An'}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.fullName ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300 focus:border-emerald-500'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                />
                {errors.fullName && <p className="text-xs text-rose-500 mt-1">{errors.fullName}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className={`w-full pl-9 pr-10 py-2 text-sm rounded-lg border ${
                    errors.password ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300 focus:border-emerald-500'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhập lại mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className={`w-full pl-9 pr-10 py-2 text-sm rounded-lg border ${
                        errors.confirmPassword
                          ? 'border-rose-400 bg-rose-50/40'
                          : 'border-slate-300 focus:border-emerald-500'
                      } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email <span className="text-slate-400 font-normal">(không bắt buộc)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ten@email.com"
                        className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border ${
                          errors.email ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300 focus:border-emerald-500'
                        } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                      />
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                    {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                  </div>

                  {role === 'HS' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Lớp học <span className="text-slate-400 font-normal">(không bắt buộc)</span>
                      </label>
                      <input
                        type="text"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        placeholder="Ví dụ: 11A1, 12A3"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Số điện thoại <span className="text-slate-400 font-normal">(không bắt buộc)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="0912..."
                          className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border ${
                            errors.phoneNumber
                              ? 'border-rose-400 bg-rose-50/40'
                              : 'border-slate-300 focus:border-emerald-500'
                          } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                        />
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                      {errors.phoneNumber && (
                        <p className="text-xs text-rose-500 mt-1">{errors.phoneNumber}</p>
                      )}
                    </div>
                  )}
                </div>

                {role === 'HS' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số điện thoại <span className="text-slate-400 font-normal">(không bắt buộc)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0912..."
                        className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border ${
                          errors.phoneNumber
                            ? 'border-rose-400 bg-rose-50/40'
                            : 'border-slate-300 focus:border-emerald-500'
                        } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-xs text-rose-500 mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Đăng nhập
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Hoàn tất đăng ký
                </>
              )}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-slate-600">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrors({});
                  }}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Đăng ký tài khoản mới
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrors({});
                  }}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Quay lại đăng nhập
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
