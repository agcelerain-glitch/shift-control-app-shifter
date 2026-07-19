// ユーザー用レイアウト: ヘッダーナビ・テーマはブランド系（クリーン）

import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { CalendarDays, MessageSquare, User, FilePlus, BookOpen, LogOut, CalendarCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', label: 'カレンダー', icon: CalendarDays, end: true },
  { to: '/board', label: '掲示板', icon: MessageSquare },
  { to: '/personal', label: '自分のシフト', icon: User },
  { to: '/request', label: 'シフト申請', icon: FilePlus },
  { to: '/manual-user', label: 'マニュアル', icon: BookOpen },
];

export function UserLayout({ children }: { children: ReactNode }) {
  const { name, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900">シフト管理</span>
            <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">ユーザー</span>
          </div>
          <div className="flex items-center gap-3">
            {name && <span className="text-sm text-gray-600 hidden sm:inline">{name}さん</span>}
            <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100" title="ログアウト">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <nav className="sticky top-14 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-2 flex gap-1 overflow-x-auto">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  isActive ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <n.icon className="w-4 h-4" />
              {n.label}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full opacity-0 transition-opacity" />
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6 animate-fadeIn">{children}</main>
    </div>
  );
}
