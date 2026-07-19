// /personal 自分のシフト: name一致のシフトを「予定/確定/当日」で切り替え表示、コピー機能付き

import { useMemo, useState } from 'react';
import { UserLayout } from '../components/UserLayout';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card, EmptyState, Badge, Button, Tabs } from '../components/ui';
import { Copy, CalendarDays, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { formatDateJP, copyToClipboard, todayStr, weekdayJP } from '../lib/utils';
import { TEMPLATE_LABELS } from '../lib/types';
import type { Shift } from '../lib/types';
import { cancelShift } from '../lib/db';

type Tab = 'today' | 'plan' | 'confirmed';

function ShiftCard({ shift, onCopy, onCancel }: { shift: Shift; onCopy: (text: string, label: string) => void; onCancel?: (shift: Shift) => void }) {
  const timeLabel =
    shift.timeType === 'template' && shift.template
      ? TEMPLATE_LABELS[shift.template]
      : shift.timeType === 'time'
        ? `${shift.timeStart}〜${shift.timeEnd}`
        : shift.timeType === 'other'
          ? 'その他'
          : '時間指定なし';

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-sm font-medium ${weekdayJP(shift.date) === '日' ? 'text-red-500' : weekdayJP(shift.date) === '土' ? 'text-blue-500' : 'text-gray-700'}`}>
              {formatDateJP(shift.date)}
            </span>
            <Badge color={shift.status === 'confirmed' ? 'confirmed' : 'plan'}>
              {shift.status === 'confirmed' ? '確定' : '予定'}
            </Badge>
          </div>
          <p className="font-medium text-gray-900 mb-1">{shift.subject}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeLabel}</span>
            {shift.place && <span>場所: {shift.place}</span>}
            {shift.headcount && <span>人数: {shift.headcount}人</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
        <Button size="sm" variant="secondary" onClick={() => onCopy(`${formatDateJP(shift.date)} ${shift.subject}`, '件名のみコピーしました')}>
          <Copy className="w-3.5 h-3.5" />件名のみ
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onCopy(`${formatDateJP(shift.date)} ${shift.subject} ${timeLabel}${shift.place ? ` 場所:${shift.place}` : ''}`, '1日分コピーしました')}>
          <Copy className="w-3.5 h-3.5" />1日分
        </Button>
        {shift.status === 'plan' && onCancel && (
          <Button size="sm" variant="secondary" className="ml-auto text-red-500 hover:bg-red-50" onClick={() => onCancel(shift)}>
            <Trash2 className="w-3.5 h-3.5" />申請取消
          </Button>
        )}
      </div>
    </Card>
  );
}

export function PersonalPage() {
  const { shifts } = useData();
  const { name } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('today');
  const [canceling, setCanceling] = useState<string | null>(null);
  const today = todayStr();

  const handleCancel = async (shift: Shift) => {
    if (!window.confirm(`${formatDateJP(shift.date)} の「${shift.subject}」の申請を取り消しますか？`)) return;
    setCanceling(shift.id);
    try {
      const result = await cancelShift(shift.id, shift.version);
      if (result === 'forbidden') { toast.show('確定済みのシフトは取り消せま���ん', 'error'); return; }
      if (result === 'conflict') { toast.show('デ��タが更新されました。再度お試しください', 'error'); return; }
      toast.show('申請を取り消しました', 'success');
    } catch { toast.show('取り消しに失敗しました', 'error'); }
    finally { setCanceling(null); }
  };

  const mine = useMemo(() => shifts.filter((s) => s.memberName === name).sort((a, b) => a.date.localeCompare(b.date)), [shifts, name]);

  const todayList = mine.filter((s) => s.date === today);
  const planList = mine.filter((s) => s.status === 'plan' && s.date !== today);
  const confirmedList = mine.filter((s) => s.status === 'confirmed' && s.date !== today);

  const list = tab === 'today' ? todayList : tab === 'plan' ? planList : confirmedList;

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyToClipboard(text);
    toast.show(ok ? label : 'コピー失敗', ok ? 'success' : 'error');
  };

  return (
    <UserLayout>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">{name}さんのシフト</h1>
        <p className="text-sm text-gray-500">個人カレンダーへの転記用にコピーできます</p>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-gray-100 mb-4">
        <Tabs
          tabs={[
            { id: 'today', label: `当日 (${todayList.length})` },
            { id: 'plan', label: `予定 (${planList.length})` },
            { id: 'confirmed', label: `確定 (${confirmedList.length})` },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {list.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={tab === 'today' ? <CalendarDays className="w-10 h-10" /> : tab === 'plan' ? <Clock className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
            title={tab === 'today' ? '当日のシフトはありません' : tab === 'plan' ? '予定のシフトはありません' : '確定したシフトはありません'}
            hint="シフト申請画面から申請できます"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((s) => (
            <ShiftCard key={s.id} shift={s} onCopy={handleCopy} onCancel={canceling ? undefined : handleCancel} />
          ))}
        </div>
      )}
    </UserLayout>
  );
}
