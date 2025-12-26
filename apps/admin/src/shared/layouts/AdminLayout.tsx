import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, Settings, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { useAuth } from '../../domains/auth/hooks/useAuth';

const MENU_ITEMS = [
  { name: '대시보드', path: '/dashboard', icon: Calendar },
  { name: '초대 링크 관리', path: '/invitations', icon: Users },
  { name: '설정', path: '/settings', icon: Settings },
] as const;

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={handleSidebarClose} />}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 w-64 bg-white border-r border-border z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <span className="text-xl font-bold text-primary">상담예약 관리</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-4 space-y-1">
            {MENU_ITEMS.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium',
                    isActive
                      ? 'bg-primary-light text-primary'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                  )}
                  onClick={handleSidebarClose}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-text-secondary hover:text-error hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <LogOut size={20} />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 lg:px-8">
          <button className="p-2 lg:hidden text-text-secondary" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-text-primary">{user?.name || '관리자님'}</p>
              <p className="text-xs text-text-secondary">{user?.email || ''}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
              {user?.name?.[0] || '관'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
