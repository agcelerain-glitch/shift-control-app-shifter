// 管理者用レイアウト: ダークトーン・調整管理モード

import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faClipboardList, faPaperPlane, faMessage, faBookOpen,
  faArrowRightFromBracket, faShieldHalved, faCircleUser,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';

const navItems: { to: string; label: string; icon: IconDefinition }[] = [
  { to: '/admin-shift', label: 'シフト調整', icon: faClipboardList },
  { to: '/admin-line', label: 'LINE操作', icon: faPaperPlane },
  { to: '/admin-board', label: '掲示板管理', icon: faMessage },
  { to: '/manual-admin', label: 'マニュアル', icon: faBookOpen },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut, name } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin-top');
  };

  // サインアウトしてからユーザーログイン画面へ（必ずパスワードを要求）
  const handleGoToUser = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-admin-50 bg-slate-50">
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shadow-sm">
              <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4" />
            </div>
            <span className="font-semibold">シフト管理 — 管理者</span>
            {name && (
              <span className="text-xs text-slate-300 bg-slate-700 px-2 py-0.5 rounded-full font-medium">
                {name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleGoToUser}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-800 text-xs transition-all duration-150"
              title="ユーザーサイトへ（再ログイン必要）"
            >
              <FontAwesomeIcon icon={faCircleUser} className="w-4 h-4" />
              <span className="hidden sm:inline">ユーザーへ</span>
            </button>
            <button
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all duration-150"
              title="ログアウト"
            >
              <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <nav className="sticky top-14 z-20 bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-2 flex gap-1 overflow-x-auto">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive ? 'text-white border-b-2 border-brand-400' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              <FontAwesomeIcon icon={n.icon} className="w-4 h-4" />
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6 animate-fadeIn">{children}</main>
    </div>
  );
}
