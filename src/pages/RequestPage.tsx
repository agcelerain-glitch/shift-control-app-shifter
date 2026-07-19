// /request シフト申請: 不可（週単位）/ 申請（15分刻み・A-D件名）/ その他（給料受取のみ）

import { useState } from 'react';
import { UserLayout } from '../components/UserLayout';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Card, Button, Input, Select, Badge, EmptyState } from '../components/ui';
import { FilePlus, Ban, Clock, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDateJP, weekdayJP } from '../lib/utils';
import { createShift, findShiftByMemberDate } from '../lib/db';

type Mode = 'none' | 'apply' | 'other';

const SUBJECT_OPTIONS = ['A帯', 'B帯', 'C帯', 'D帯'] as const;
type SubjectOption = (typeof SUBJECT_OPTIONS)[number];

// 15分刻みの時刻リスト 00:00〜23:45
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 15, 30, 45]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

// 任意の日付文字列 → その週の月曜〜日曜を返す（ローカル日付で計算）
function getWeekRange(dateStr: string): { start: string; end: string } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=日
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monDate = new Date(d);
  monDate.setDate(d.getDate() + diffToMon);
  const sunDate = new Date(d);
  sunDate.setDate(d.getDate() + diffToMon + 6);
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  return { start: fmt(monDate), end: fmt(sunDate) };
}

// 週の月曜日から7日分の日付文字列を返す（ローカル日付）
function getWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}

export function RequestPage() {
  const { name } = useAuth();
  const { shifts } = useData();
  const toast = useToast();

  const [mode, setMode] = useState<Mode>('apply');
  const [date, setDate] = useState('');
  const [subjectOption, setSubjectOption] = useState<SubjectOption>('A帯');
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('17:00');
  const [place, setPlace] = useState('');
  const [headcount, setHeadcount] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [dupWarning, setDupWarning] = useState<string | null>(null);

  const myRecent = shifts.filter((s) => s.memberName === name).slice(-5);
  const weekRange = mode === 'none' ? getWeekRange(date) : null;

  const checkDup = async (d: string) => {
    setDate(d);
    if (!d || !name || mode !== 'apply') return;
    const existing = await findShiftByMemberDate(name, d);
    setDupWarning(existing ? `${formatDateJP(d)} は既に申請済みです（${existing.subject}）` : null);
  };

  const handleSubmit = async () => {
    if (!name) return;

    if (mode === 'none') {
      if (!weekRange) { toast.show('週を選択してください', 'error'); return; }
      setSubmitting(true);
      try {
        const dates = getWeekDates(weekRange.start);
        await Promise.all(
          dates.map((d) => createShift({ memberName: name, date: d, timeType: 'none', subject: '不可（シフトなし）' }))
        );
        toast.show(
          `${formatDateJP(weekRange.start)}〜${formatDateJP(weekRange.end)} を「不可」で申請しました`,
          'success',
        );
        resetForm();
      } catch { toast.show('申請に失敗しました', 'error'); }
      finally { setSubmitting(false); }
      return;
    }

    if (mode === 'other') {
      if (!date) { toast.show('日付を選択してください', 'error'); return; }
      setSubmitting(true);
      try {
        await createShift({ memberName: name, date, timeType: 'other', subject: '給料受取のみ' });
        toast.show('「その他（給料受取のみ）」を申請しました', 'success');
        resetForm();
      } catch { toast.show('申請に失敗しました', 'error'); }
      finally { setSubmitting(false); }
      return;
    }

    // apply
    if (!date) { toast.show('日付を選択してください', 'error'); return; }
    if (dupWarning) { toast.show('重複申請のため送信を中止しました', 'error'); return; }
    if (timeStart >= timeEnd) { toast.show('終了時刻は開始時刻より後にしてください', 'error'); return; }
    setSubmitting(true);
    try {
      await createShift({
        memberName: name,
        date,
        timeType: 'time',
        timeStart,
        timeEnd,
        subject: `${subjectOption} ${name}`,
        place: place.trim() || undefined,
        headcount: Number(headcount) || undefined,
      });
      toast.show('シフトを申請しました', 'success');
      resetForm();
    } catch { toast.show('申請に失敗しました', 'error'); }
    finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setDate(''); setPlace(''); setHeadcount('1'); setDupWarning(null);
  };

  const modeCards: { id: Mode; label: string; desc: string; icon: typeof Ban; color: string }[] = [
    { id: 'none', label: '不可（シフトなし）', desc: '指定週まるごと入れません', icon: Ban, color: 'border-gray-200 hover:border-gray-400' },
    { id: 'apply', label: 'シフト申請', desc: '時間・件名を指定して申請', icon: Clock, color: 'border-brand-200 hover:border-brand-400' },
    { id: 'other', label: 'その他（給料受取のみ）', desc: '出勤せず給料のみ受取', icon: Wallet, color: 'border-amber-200 hover:border-amber-400' },
  ];

  return (
    <UserLayout>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">シフト申請</h1>
        <p className="text-sm text-gray-500">まず申請の種類を選んでください</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {modeCards.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); resetForm(); }}
            className={`text-left p-4 rounded-2xl border-2 bg-white transition-all ${mode === m.id ? `${m.color} ring-2 ring-brand-200` : `${m.color} shadow-card`}`}
          >
            <m.icon className={`w-6 h-6 mb-2 ${mode === m.id ? 'text-brand-600' : 'text-gray-400'}`} />
            <p className={`font-medium ${mode === m.id ? 'text-brand-700' : 'text-gray-700'}`}>{m.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
          </button>
        ))}
      </div>

      <Card className="p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* 不可モード: 週選択 */}
          {mode === 'none' && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                週を選択（その週の月〜日がすべて不可になります）
              </label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              {weekRange && (
                <div className="mt-2 flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">
                  <Ban className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>{formatDateJP(weekRange.start)}（月）〜{formatDateJP(weekRange.end)}（日）</strong> を不可で申請します
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 申請モード */}
          {mode === 'apply' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">日付</label>
                <Input type="date" value={date} onChange={(e) => checkDup(e.target.value)} />
                {date && (
                  <p className={`text-xs mt-1 ${weekdayJP(date) === '日' ? 'text-red-500' : weekdayJP(date) === '土' ? 'text-blue-500' : 'text-gray-500'}`}>
                    {formatDateJP(date)}
                  </p>
                )}
                {dupWarning && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
                    <AlertTriangle className="w-3.5 h-3.5" />{dupWarning}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">件名</label>
                <Select value={subjectOption} onChange={(e) => setSubjectOption(e.target.value as SubjectOption)}>
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
                <p className="text-xs text-gray-400 mt-1">送信件名: 「{subjectOption} {name ?? '…'}」</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">開始時刻</label>
                <Select value={timeStart} onChange={(e) => setTimeStart(e.target.value)}>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">終了時刻</label>
                <Select value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)}>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">場所（任意）</label>
                <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="例: 本店" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">人数（任意）</label>
                <Input type="number" min="1" value={headcount} onChange={(e) => setHeadcount(e.target.value)} />
              </div>
            </>
          )}

          {/* その他モード */}
          {mode === 'other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">日付</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              {date && (
                <p className={`text-xs mt-1 ${weekdayJP(date) === '日' ? 'text-red-500' : weekdayJP(date) === '土' ? 'text-blue-500' : 'text-gray-500'}`}>
                  {formatDateJP(date)}
                </p>
              )}
            </div>
          )}

        </div>

        <div className="mt-5 flex justify-end">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || (mode === 'apply' && !!dupWarning)}
          >
            {submitting ? '送信中…' : mode === 'none' ? '週まとめて不可を申請' : '申請を送信'}
            {!submitting && <CheckCircle2 className="w-4 h-4" />}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
          <FilePlus className="w-4 h-4" />最近の自分の申請
        </h2>
        {myRecent.length === 0 ? (
          <EmptyState icon={<FilePlus className="w-8 h-8" />} title="まだ申請がありません" />
        ) : (
          <div className="space-y-2">
            {myRecent.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <Badge color={s.status === 'confirmed' ? 'confirmed' : 'plan'}>{s.status === 'confirmed' ? '確定' : '予定'}</Badge>
                  <span className="text-sm text-gray-700">{formatDateJP(s.date)} · {s.subject}</span>
                </div>
                <span className="text-xs text-gray-400">申請日 {new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </UserLayout>
  );
}
