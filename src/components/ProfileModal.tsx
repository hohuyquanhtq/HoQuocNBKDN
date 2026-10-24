import React, { useState } from 'react';
import { User } from '../types/index.ts';
import { updateUserProfile, changeUserPassword } from '../services/storage.ts';
import { User as UserIcon, Lock, Mail, BookOpen, Phone, CheckCircle2, ShieldCheck, X, KeyRound } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdated: (user: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdated,
}) => {
  const [tab, setTab] = useState<'info' | 'password'>('info');

  // Profile fields
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email || '');
  const [className, setClassName] = useState(currentUser.className || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Messages
  const [infoMsg, setInfoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setInfoMsg({ type: 'error', text: 'Họ và tên không được để trống.' });
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setInfoMsg({ type: 'error', text: 'Định dạng email không hợp lệ.' });
        return;
      }
    }

    setIsSubmitting(true);
    setInfoMsg(null);

    try {
      const updated = await updateUserProfile(currentUser.id, {
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        className: currentUser.role === 'HS' ? (className.trim() || undefined) : undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      });

      if (updated) {
        onUpdated(updated);
        setInfoMsg({ type: 'success', text: 'Đã cập nhật thông tin hồ sơ thành công!' });
      } else {
        setInfoMsg({ type: 'error', text: 'Không thể cập nhật thông tin. Vui lòng thử lại.' });
      }
    } catch {
      setInfoMsg({ type: 'error', text: 'Đã xảy ra lỗi khi lưu thông tin.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      setPassMsg({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại.' });
      return;
    }
    if (newPassword.length < 8) {
      setPassMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setIsSubmitting(true);
    setPassMsg(null);

    try {
      const res = await changeUserPassword(currentUser.id, oldPassword, newPassword);
      if (res.success) {
        setPassMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassMsg({ type: 'error', text: res.error || 'Đổi mật khẩu thất bại.' });
      }
    } catch {
      setPassMsg({ type: 'error', text: 'Đã xảy ra lỗi khi đổi mật khẩu.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold">
              {currentUser.role === 'GV' ? 'GV' : 'HS'}
            </div>
            <div>
              <h2 className="text-base font-bold">{currentUser.fullName}</h2>
              <p className="text-xs text-slate-400">
                @{currentUser.username} • {currentUser.role === 'GV' ? 'Tài khoản Giáo viên' : `Học sinh ${currentUser.className || ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setTab('info')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              tab === 'info'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Thông tin cá nhân
          </button>
          <button
            type="button"
            onClick={() => setTab('password')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              tab === 'password'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Đổi mật khẩu
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {tab === 'info' ? (
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              {infoMsg && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium ${
                    infoMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {infoMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đăng nhập</label>
                <input
                  type="text"
                  value={currentUser.username}
                  disabled
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">Tên đăng nhập là định danh cố định không thể thay đổi.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email liên lạc</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@educhem.edu.vn"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {currentUser.role === 'HS' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lớp</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="11A1"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="09..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Lưu thay đổi hồ sơ
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passMsg && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium ${
                    passMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {passMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang dùng"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" /> Cập nhật mật khẩu
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Mật khẩu của bạn được mã hóa bằng thuật toán SHA-256 kết hợp mã muối bảo mật (salt), không lưu trữ văn bản thuần.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
