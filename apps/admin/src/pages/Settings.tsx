import { useState } from 'react';
import { LogOut, User, Shield, X } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { useAuth } from '../domains/auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">설정</h1>
        <p className="text-text-secondary text-sm mt-1">계정 및 시스템 설정을 관리합니다</p>
      </div>

      {/* Account Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">계정 정보</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">이름</label>
            <div className="mt-1 text-text-primary">{user?.name || '-'}</div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary">이메일</label>
            <div className="mt-1 text-text-primary">{user?.email || '-'}</div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary">사용자 ID</label>
            <div className="mt-1 text-text-primary font-mono text-sm">{user?.userId || '-'}</div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">보안</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-bg-secondary rounded-lg">
            <p className="text-sm text-text-secondary">
              Google OAuth를 통해 로그인합니다. 계정 관리는 Google 계정 설정에서 할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Logout Section */}
      <div className="card border-error/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">로그아웃</h3>
            <p className="text-sm text-text-secondary mt-1">현재 계정에서 로그아웃합니다</p>
          </div>
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="btn-secondary flex items-center gap-2 text-error border-error hover:bg-red-50"
          >
            <LogOut size={20} />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Dialog open={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} className="relative z-50">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white rounded-xl shadow-xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-bold text-text-primary">로그아웃</Dialog.Title>
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <Dialog.Description className="text-text-secondary">
              정말 로그아웃하시겠습니까? 다시 로그인하셔야 합니다.
            </Dialog.Description>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button onClick={() => setIsLogoutModalOpen(false)} className="btn-outline">
                취소
              </button>
              <button onClick={handleLogout} className="btn-primary bg-error hover:bg-error/90 text-white">
                로그아웃
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default Settings;
