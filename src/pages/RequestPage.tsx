// /request シフト申請: 不可 or 申請(時間/テンプレ) or その他(給料受取のみ)。重複申請を事前照会で防止

import { useState } from 'react';
import { UserLayout } from '../components/UserLayout';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Card, Button, Input, Select, Badge, EmptyState } from '../components/ui';
import { FilePlus, Ban, Clock, Layers, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDateJP, weekdayJP } from '../lib/utils';
import { TEMPLATE_LABELS, TEMPLATE_TIMES, type TemplateCode, type TimeType } from '../lib/types';
import { createShift, findShiftByMemberDate } from '../lib/db';

type Mode = 'none' | 'apply' | 'other';

export function RequestPage() {
  const { name } = useAuth();
  const { shifts } = useData();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('apply');
  const [date, setDate] = useState('');
  const [timeType, setTimeType] = useState<TimeType>('time');
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('17:00');
  const [template, setTemplate] = useState<TemplateCode>('A');
  const [subject, setSubject] = useState('');
  const [place, setPlace] = useState('');
  const [headcount, setHeadcount] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [dupWarning, setDupWarning] = useState<string | null>(null);

  const myRecent = shifts.filter((s) => s.memberName === name).slice(-5);

  const checkDup = async (d: string) => {
    setDate(d);
    if (!d || !name) return;
    const existing = await findShiftByMemberDate(name, d);
    setDupWarning(existing ? `${formatDateJP(d)} は既に申請済みです（${existing.subject}）` : null);
  };

  const handleSubmit = async () => {
    if (!name) return;
    if (mode === 'none') {
      if (!date) { toast.show('日付を選択してください', 'error'); return; }
      setSubmitting(true);
      try {
        await createShift({ memberName: name, date, timeType: 'none', subject: '不可（シフトなし）' });
        toast.show('「不可」を申請しました', 'success');
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
    if (!subject.trim()) { toast.show('件名を入力してください', 'error'); return; }
    if (dupWarning) { toast.show('重複申請のため送信を中止しました', 'error'); return; }
    setSubmitting(true);
    try {
      const base = { memberName: name, date, subject: subject.trim(), place: place.trim() || undefined, headcount: Number(headcount) || undefined };
      if (timeType === 'time') {
        await createShift({ ...base, timeType: 'time', timeStart, timeEnd });
      } else if (timeType === 'template') {
        await createShift({ ...base, timeType: 'template', template });
      } else {
        await createShift({ ...base, timeType: 'none' });
      }
      toast.show('シフトを申請しました', 'success');
      resetForm();
    } catch { toast.show('申請に失敗しました', 'error'); }
    finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setDate(''); setSubject(''); setPlace(''); setHeadcount('1'); setDupWarning(null);
  };

  const modeCards: { id: Mode; label: string; desc: string; icon: typeof Ban; color: string }[] = [
    { id: 'none', label: '不可（シフトなし）', desc: 'その日は入れません', icon: Ban, color: 'border-gray-200 hover:border-gray-400' },
    { id: 'apply', label: '申請する', desc: '時間指定 or テンプレ選択', icon: Clock, color: 'border-brand-200 hover:border-brand-400' },
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

          {mode === 'apply' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">時間指定 / テンプレ</label>
                <Select value={timeType} onChange={(e) => setTimeType(e.target.value as TimeType)}>
                  <option value="time">時間指定（開始/終了）</option>
                  <option value="template">テンプレ選択（A帯〜D帯）</option>
                </Select>
              </div>
              {timeType === 'time' && (
                <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">開始</label>
                    <Input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">終了</label>
                    <Input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
                  </div>
                </div>
              )}
              {timeType === 'template' && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">テンプレ</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['A', 'B', 'C', 'D'] as TemplateCode[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTemplate(t)}
                        className={`p-3 rounded-xl border-2 text-center transition ${template === t ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="flex items-center justify-center gap-1 font-medium text-gray-800">
                          <Layers className="w-4 h-4" />{TEMPLATE_LABELS[t]}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{TEMPLATE_TIMES[t].start}〜{TEMPLATE_TIMES[t].end}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">件名 <span className="text-red-500">*</span></label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="例: レジ担当" />
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
        </div>

        <div className="mt-5 flex justify-end">
          <Button size="lg" onClick={handleSubmit} disabled={submitting || !!dupWarning}>
            {submitting ? '送信中…' : '申請を送信'}
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
