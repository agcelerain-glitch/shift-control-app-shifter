// /manual-user ユーザー操作マニュアル（userログイン時のみ閲覧可）

import { UserLayout } from '../components/UserLayout';
import { Card } from '../components/ui';
import { CalendarDays, MessageSquare, User, FilePlus, Copy, Layers, Ban, Wallet } from 'lucide-react';

const sections = [
  {
    icon: CalendarDays,
    title: 'カレンダー',
    body: '全メンバーのシフトが月表示で重なって表示されます。黄色＝予定(plan)、緑＝確定(confirmed)、赤い丸＝当日です。日付をタップするとその日の詳細が見られます。',
  },
  {
    icon: MessageSquare,
    title: '掲示板',
    body: '管理者からのお知らせ（boardPublic）を新しい順で確認できます。読み取り専用です。',
  },
  {
    icon: User,
    title: '自分のシフト',
    body: '自分のシフトのみを「当日 / 予定 / 確定」のタブで切り替え表示します。各シフトには「件名のみ」「1日分」のコピー機能があり、個人カレンダーへの転記に使えます。',
  },
  {
    icon: FilePlus,
    title: 'シフト申請',
    body: '3つのモードから選びます：①不可（シフトなし）②申請する（時間指定 または テンプレA帯〜D帯）③その他（給料受取のみ）。同じ日付に既に申請がある場合は重複警告が出て二重申請を防ぎます。',
  },
  {
    icon: Copy,
    title: 'コピー機能',
    body: '「自分のシフト」画面でコピー単位を選べます。件名のみ、または1日分（日付+件名+時間+場所）をクリップボードへコピーします。',
  },
  {
    icon: Layers,
    title: 'テンプレ（A帯〜D帯）',
    body: 'A帯=09:00〜13:00 / B帯=13:00〜17:00 / C帯=17:00〜21:00 / D帯=21:00〜25:00。テンプレ選択で時間入力を省略できます。',
  },
  {
    icon: Ban,
    title: '不可（シフトなし）の申請',
    body: 'その日出勤できない場合は「不可」を申請してください。管理者側で把握できます。',
  },
  {
    icon: Wallet,
    title: 'その他（給料受取のみ）',
    body: '出勤はしないが給料を受け取りたい日がある場合に申請します。',
  },
];

export function ManualUserPage() {
  return (
    <UserLayout>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">ユーザー操作マニュアル</h1>
        <p className="text-sm text-gray-500">使い方のご案内</p>
      </div>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 shrink-0">
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
    </UserLayout>
  );
}
