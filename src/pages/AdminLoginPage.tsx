// /admin-top 管理者ログイン画面（admin用固定メール+パスワード）

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button, Input } from '../components/ui';
import { isFirebaseConfigured } from '../lib/firebase';

export function AdminLoginPage() {
  const { signInAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      await signInAdmin(password);
      toast.show('管理者ログインしました', 'success');
      navigate('/admin-shift');
    } catch {
      toast.show('ログイン失敗: パスワードを確認してください', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-700 flex items-center justify-center text-white shadow-lg shadow-slate-900/50 mb-3 ring-1 ring-slate-600">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white">管理者ログイン</h1>
          <p className="text-sm text-slate-400 mt-1">シフト管理システム</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-700 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">管理者パスワード</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                className="pl-9 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                autoFocus
              />
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full bg-brand-600 hover:bg-brand-700" disabled={loading}>
            {loading ? 'ログイン中…' : '管理者ログイン'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => navigate('/login')} className="text-xs text-slate-500 hover:text-slate-300">
            ユーザーログインはこちら
          </button>
        </div>
        {!isFirebaseConfigured && (
          <p className="text-center text-xs text-amber-400 mt-3 bg-amber-950/40 rounded-lg py-2 border border-amber-800/40">
            モックモードで動作中（パスワード任意で通過）
          </p>
        )}
      </div>
    </div>
  );
}
