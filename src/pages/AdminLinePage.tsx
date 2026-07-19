// /admin-line LINE操作: UIとfetchのみ。実処理はVITE_API_BASE_URLのHeroku APIへ投げる

import { useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Card, Button, Textarea, Select } from '../components/ui';
import { Send, Bell, MessageCircle, Megaphone, Users, Info } from 'lucide-react';
import { callLineApi } from '../lib/db';
import { isFirebaseConfigured } from '../lib/firebase';
import { API_BASE_URL } from '../lib/firebase';
import { formatDateJP, todayStr } from '../lib/utils';

export function AdminLinePage() {
  const { members, shifts } = useData();
  const toast = useToast();
  const [sending, setSending] = useState(false);

  // グループ送信: シフト連絡
  const [shiftMsg, setShiftMsg] = useState('');
  // 当日ポジション配置
  const [positionMsg, setPositionMsg] = useState('');
  // セルフ通知
  const [selfMsg, setSelfMsg] = useState('');
  // 個別チャット
  const [targetMember, setTargetMember] = useState('');
  const [dmMsg, setDmMsg] = useState('');

  const todayShifts = shifts.filter((s) => s.date === todayStr());

  const send = async (path: string, body: Record<string, unknown>, label: string) => {
    setSending(true);
    try {
      const res = await callLineApi(path, body);
      toast.show(res.ok ? `${label}: ${res.message}` : `${label}失敗: ${res.message}`, res.ok ? 'success' : 'error');
    } catch {
      toast.show(`${label}失敗`, 'error');
    } finally {
      setSending(false);
    }
  };

  const lineMembers = members.filter((m) => m.lineUserId);

  return (
    <AdminLayout>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">LINE操作</h1>
        <p className="text-sm text-gray-500">バックエンドAPI（Heroku）へ送信します</p>
      </div>

      {!API_BASE_URL && !isFirebaseConfigured && (
        <Card className="p-3 mb-4 bg-amber-50 border-amber-200">
          <p className="text-xs text-amber-700 flex items-center gap-1.5">
            <Info className="w-4 h-4" />モックモード: VITE_API_BASE_URL未設定のため実際の送信は行わず成功扱い
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* グループ送信: シフト連絡 */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">グループ送信① シフト連絡</h2>
              <p className="text-xs text-gray-500">グループへシフト情報を一括送信</p>
            </div>
          </div>
          <Textarea
            rows={4}
            value={shiftMsg}
            onChange={(e) => setShiftMsg(e.target.value)}
            placeholder="例: 今週のシフトをお知らせします…"
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={() => send('/line/group/shift', { message: shiftMsg }, 'シフト連絡')} disabled={sending || !shiftMsg.trim()}>
              <Send className="w-4 h-4" />送信
            </Button>
          </div>
        </Card>

        {/* 当日ポジション配置連絡 */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">グループ送信② 当日ポジション配置</h2>
              <p className="text-xs text-gray-500">当日の配置をグループへ連絡</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 mb-2 text-xs text-gray-600 max-h-32 overflow-y-auto">
            <p className="font-medium text-blue-700 mb-1">本日({formatDateJP(todayStr())})のシフト:</p>
            {todayShifts.length === 0 ? (
              <p>シフトなし</p>
            ) : (
              todayShifts.map((s) => <p key={s.id}>{s.memberName} · {s.subject}</p>)
            )}
          </div>
          <Textarea rows={3} value={positionMsg} onChange={(e) => setPositionMsg(e.target.value)} placeholder="例: 本日の配置: レジ=山田さん、品出し=佐藤さん" />
          <div className="mt-3 flex justify-end">
            <Button onClick={() => send('/line/group/position', { message: positionMsg, date: todayStr() }, '当日配置')} disabled={sending || !positionMsg.trim()}>
              <Send className="w-4 h-4" />送信
            </Button>
          </div>
        </Card>

        {/* セルフ通知 */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">自分への連絡（セルフ通知）</h2>
              <p className="text-xs text-gray-500">自分宛てにメモ付きで通知</p>
            </div>
          </div>
          <Textarea rows={4} value={selfMsg} onChange={(e) => setSelfMsg(e.target.value)} placeholder="自分へのリマインダー…" />
          <div className="mt-3 flex justify-end">
            <Button onClick={() => send('/line/self', { message: selfMsg }, 'セルフ通知')} disabled={sending || !selfMsg.trim()}>
              <Send className="w-4 h-4" />送信
            </Button>
          </div>
        </Card>

        {/* 個別チャット */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">個別チャット連絡</h2>
              <p className="text-xs text-gray-500">メンバーを選んで個別送信</p>
            </div>
          </div>
          <label className="block text-xs font-medium text-gray-600 mb-1">送信先メンバー</label>
          <Select value={targetMember} onChange={(e) => setTargetMember(e.target.value)} className="mb-3">
            <option value="">選択してください</option>
            {lineMembers.length === 0 ? (
              <option disabled>LINE連携メンバーなし</option>
            ) : (
              lineMembers.map((m) => <option key={m.id} value={m.lineUserId}>{m.name}</option>)
            )}
          </Select>
          <Textarea rows={3} value={dmMsg} onChange={(e) => setDmMsg(e.target.value)} placeholder="メッセージ本文…" />
          <div className="mt-3 flex justify-end">
            <Button onClick={() => send('/line/dm', { lineUserId: targetMember, message: dmMsg }, '個別チャット')} disabled={sending || !targetMember || !dmMsg.trim()}>
              <Send className="w-4 h-4" />送信
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-4 mt-4">
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />トークン等の秘匿情報はフロントに置かず、Heroku側のAPIで取り扱います。フロントは fetch でエンドポイントを呼ぶだけです。
        </p>
      </Card>
    </AdminLayout>
  );
}
