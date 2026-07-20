// ユーザー用レイアウト: ヘッダーナビ・テーマはブランド系（クリーン）

import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faCalendarDays, faMessage, faCircleUser, faFileCirclePlus, faBookOpen,
  faArrowRightFromBracket, faCalendarCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';

const navItems: { to: string; label: string; icon: IconDefinition; end?: boolean }[] = [
  { to: '/', label: 'カレンダー', icon: faCalendarDays, end: true },
  { to: '/board', label: '掲示板', icon: faMessage },
  { to: '/personal', label: '自分のシフト', icon: faCircleUser },
  { to: '/request', label: 'シフト申請', icon: faFileCirclePlus },
  { to: '/manual-user', label: 'マニュアル', icon: faBookOpen },
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
            <div className="w-8 h-8 rounded-lg bg-[linear-gradient(to_bottom,#60a5fa,#2563eb_18%,#2563eb)] flex items-center justify-center text-white shadow-sm">
              <FontAwesomeIcon icon={faCalendarCheck} className="w-4 h-4" />
            </div>
            <span className="font-semibold text-gray-900">シフト管理</span>
            <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">ユーザー</span>
          </div>
          <div className="flex items-center gap-3">
            {name && <span className="text-sm text-gray-600 hidden sm:inline">{name}さん</span>}
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-150"
              title="ログアウト"
            >
              <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-4 h-4" />
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
                `flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-150 relative ${
                  isActive ? 'text-brand-600' : 'text-gray-500 hover:text-gray-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <FontAwesomeIcon icon={n.icon} className="w-4 h-4" />
                  {n.label}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full transition-opacity duration-150 ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6 animate-fadeIn">{children}</main>

      <footer className="mt-8 pb-6 text-center">
        <button
          onClick={async () => { await signOut(); navigate('/admin-top'); }}
          className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
        >
          管理者ログイン
        </button>
      </footer>
    </div>
  );
}
