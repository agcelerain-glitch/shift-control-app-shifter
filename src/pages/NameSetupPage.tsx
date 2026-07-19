// 名前入力画面: ログイン直後に名前を入力、members コレクションへ保存し以降の紐づけに使う

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button, Input } from '../components/ui';

export function NameSetupPage() {
  const { setName, name } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [value, setValue] = useState(name ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      toast.show('名前を入力してください', 'error');
      return;
    }
    setName(trimmed);
    toast.show(`${trimmed} さん、ようこそ`, 'success');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-600 mb-3">
            <User className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">お名前を教えてください</h1>
          <p className="text-sm text-gray-500 mt-1">シフト・掲示板はこの名前で紐づきます</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">名前</label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="例: 山田 花子"
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            次へ
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
