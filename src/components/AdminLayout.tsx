// 管理者用レイアウト: ダークトーン・調整管理モード

import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ClipboardList, Send, MessageSquare, BookOpen, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/admin-shift', label: 'シフト調整', icon: ClipboardList },
  { to: '/admin-line', label: 'LINE操作', icon: Send },
  { to: '/admin-board', label: '掲示板管理', icon: MessageSquare },
  { to: '/manual-admin', label: 'マニュアル', icon: BookOpen },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin-top');
  };

  return (
    <div className="min-h-screen bg-admin-50 bg-slate-50">
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-semibold">シフト管理 — 管理者</span>
            <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full">admin</span>
          </div>
          <button onClick={handleSignOut} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800" title="ログアウト">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <nav className="sticky top-14 z-20 bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-2 flex gap-1 overflow-x-auto">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'text-white border-b-2 border-brand-400' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6 animate-fadeIn">{children}</main>
    </div>
  );
}
