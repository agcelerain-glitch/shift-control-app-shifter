// /manual-admin 管理者操作マニュアル（adminログイン時のみ閲覧可）

import { AdminLayout } from '../components/AdminLayout';
import { Card } from '../components/ui';
import { ClipboardList, Send, CheckCircle2, XCircle, Sliders, RotateCcw, Users, Lock, Megaphone } from 'lucide-react';

const sections = [
  {
    icon: ClipboardList,
    title: 'シフト調整',
    body: 'ユーザーの申請（status=plan）に対し「許可 / 否認 / 調整」を行います。許可するとstatusがconfirmedになり、ユーザーのカレンダーに確定タグで反映されます。5つのタグ（場所/時間/名前/曜日/人数）で並び替え・絞り込みができます。',
  },
  {
    icon: CheckCircle2,
    title: '許可操作',
    body: 'planのシフトを確定（confirmed）にします。runTransaction + version楽観ロックで競合を安全に処理します。競合時は画面を更新して最新データで再試行してください。',
  },
  {
    icon: XCircle,
    title: '否認操作',
    body: '確定済みや申請をplanに戻します。誤って確定した場合の取り消しにも使います。',
  },
  {
    icon: Sliders,
    title: '調整依頼',
    body: '時間・件名・場所を上書きして確定できます。ユーザーの申請内容を管理者側で微調整する場合に使います。',
  },
  {
    icon: RotateCcw,
    title: '復元（7日以内）',
    body: '承認操作のたびにapprovalLogsに変更前スナップショットが保存されます。「復元ログ」ボタンから7日以内なら元の状態に戻せます（1週間の保険）。',
  },
  {
    icon: Users,
    title: '名簿',
    body: 'メンバー一覧から個別に確認できます。記入日(createdAt)・最終更新日(updatedAt)・申請履歴が見られ、LINE連携がある場合はLINEへのジャンプボタンが表示されます。',
  },
  {
    icon: Send,
    title: 'LINE操作',
    body: '①グループ送信(シフト連絡) ②当日ポジション配置連絡 ③自分への連絡(セルフ通知) ④個別チャット連絡(メンバー選択)。各操作は Heroku のAPI（VITE_API_BASE_URL）へfetchで投げます。トークン等はフロントに置きません。',
  },
  {
    icon: Megaphone,
    title: '全体掲示板',
    body: 'boardPublicへ投稿・削除。「本日は給料日です」「シフト変更です」など全ユーザー向けのお知らせを配信します。',
  },
  {
    icon: Lock,
    title: '非公開メモ',
    body: 'boardPrivateへメモ・通知を投稿。adminのみ閲覧可能。「シフト送信済み」等の履歴や個人的なメモに使います。',
  },
];

export function ManualAdminPage() {
  return (
    <AdminLayout>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">管理者操作マニュアル</h1>
        <p className="text-sm text-gray-500">管理者機能のご案内</p>
      </div>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">{s.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
