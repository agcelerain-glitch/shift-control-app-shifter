// /admin-shift シフト調整: 許可/否認/調整依頼、5タグソート、名簿・ログ確認、LINEジャンプ、復元

import { useMemo, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, Input, Select, Modal, EmptyState } from '../components/ui';
import {
  CheckCircle2, XCircle, Sliders, RotateCcw, Users, MessageCircle, MapPin, Clock, User as UserIcon,
  CalendarDays, Hash, ChevronDown, ChevronRight, History,
} from 'lucide-react';
import { formatDateJP, formatDateTimeJP, isPast7Days, weekdayJP, todayStr } from '../lib/utils';
import { TEMPLATE_LABELS } from '../lib/types';
import type { Shift, ApprovalLog } from '../lib/types';
import { approveShift, restoreShift, updateMemberLineId } from '../lib/db';

type SortKey = 'place' | 'time' | 'name' | 'weekday' | 'headcount';

// 場所選択肢（4択）— 実際の店舗名に合わせて変更してください
const PLACE_OPTIONS = ['本店', '支店A', '支店B', '倉庫'] as const;

function timeLabelOf(s: Shift): string {
  if (s.timeType === 'template' && s.template) return TEMPLATE_LABELS[s.template];
  if (s.timeType === 'time') return `${s.timeStart}〜${s.timeEnd}`;
  if (s.timeType === 'other') return 'その他';
  return '指定なし';
}
function timeSortVal(s: Shift): number {
  if (s.timeType === 'time' && s.timeStart) return parseInt(s.timeStart.replace(':', ''), 10);
  if (s.timeType === 'template' && s.template) return { A: 900, B: 1300, C: 1700, D: 2100 }[s.template];
  return 9999;
}

export function AdminShiftPage() {
  const { shifts, members, approvalLogs } = useData();
  const { name } = useAuth();
  const adminName = name ?? '管理者';
  const toast = useToast();
  const [sortKey, setSortKey] = useState<SortKey>('weekday');
  const [filter, setFilter] = useState<'all' | 'plan' | 'confirmed'>('plan');
  const [search, setSearch] = useState('');
  const [adjusting, setAdjusting] = useState<Shift | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [lineIdDraft, setLineIdDraft] = useState('');
  const [savingLineId, setSavingLineId] = useState(false);

  // 調整モーダルのフィールド
  const [adjTimeStart, setAdjTimeStart] = useState('');
  const [adjTimeEnd, setAdjTimeEnd] = useState('');
  const [adjSubject, setAdjSubject] = useState('');
  const [adjPlace, setAdjPlace] = useState('');

  const filtered = useMemo(() => {
    let list = shifts;
    if (filter === 'plan') list = list.filter((s) => s.status === 'plan');
    if (filter === 'confirmed') list = list.filter((s) => s.status === 'confirmed');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.memberName.toLowerCase().includes(q) || s.subject.toLowerCase().includes(q) || (s.place ?? '').toLowerCase().includes(q));
    }
    const sorted = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'place': return (a.place ?? 'zzz').localeCompare(b.place ?? 'zzz') || a.date.localeCompare(b.date);
        case 'time': return timeSortVal(a) - timeSortVal(b) || a.date.localeCompare(b.date);
        case 'name': return a.memberName.localeCompare(b.memberName, 'ja') || a.date.localeCompare(b.date);
        case 'weekday': return new Date(a.date).getDay() - new Date(b.date).getDay() || a.date.localeCompare(b.date);
        case 'headcount': return (b.headcount ?? 0) - (a.headcount ?? 0) || a.date.localeCompare(b.date);
      }
    });
    return sorted;
  }, [shifts, filter, search, sortKey]);

  const planCount = shifts.filter((s) => s.status === 'plan').length;

  const doApprove = async (s: Shift) => {
    try {
      const res = await approveShift({ shiftId: s.id, action: 'approve', adminName: adminName, expectedVersion: s.version });
      if (res === 'ok') toast.show(`${s.memberName}さんのシフトを確定しました`, 'success');
      else if (res === 'conflict') toast.show('競合: 最新データを再取得してください（画面を更新）', 'error');
    } catch (e) {
      toast.show(`承認エラー: ${(e as Error).message}`, 'error');
    }
  };

  const doDeny = async (s: Shift) => {
    try {
      const res = await approveShift({ shiftId: s.id, action: 'deny', adminName: adminName, expectedVersion: s.version });
      if (res === 'ok') toast.show(`${s.memberName}さんのシフトを否認（planに戻しました）`, 'info');
      else if (res === 'conflict') toast.show('競合: 画面を更新してください', 'error');
    } catch (e) {
      toast.show(`否認エラー: ${(e as Error).message}`, 'error');
    }
  };

  const openAdjust = (s: Shift) => {
    setAdjusting(s);
    setAdjTimeStart(s.timeStart ?? '09:00');
    setAdjTimeEnd(s.timeEnd ?? '17:00');
    setAdjSubject(s.subject);
    setAdjPlace(s.place ?? '');
  };

  const doAdjust = async () => {
    if (!adjusting) return;
    try {
      const adjustFields: Parameters<typeof approveShift>[0]['adjustFields'] = {
        subject: adjSubject.trim(),
        ...(adjPlace.trim() ? { place: adjPlace.trim() } : {}),
        ...(adjusting.timeType !== 'none'
          ? { timeStart: adjTimeStart, timeEnd: adjTimeEnd, timeType: 'time' as const }
          : { timeType: 'none' as const }),
      };
      const res = await approveShift({
        shiftId: adjusting.id,
        action: 'adjust',
        adminName: adminName,
        expectedVersion: adjusting.version,
        adjustFields,
      });
      if (res === 'ok') { toast.show('調整して確定しました', 'success'); setAdjusting(null); }
      else if (res === 'conflict') toast.show('競合: 画面を更新してください', 'error');
    } catch (e) {
      toast.show(`調整エラー: ${(e as Error).message}`, 'error');
    }
  };

  const doRestore = async (log: ApprovalLog) => {
    const res = await restoreShift(log.id);
    if (res === 'ok') toast.show('復元しました', 'success');
    else if (res === 'expired') toast.show('7日経過のため復元不可です', 'error');
    else toast.show('復元に失敗しました', 'error');
  };

  const memberShifts = selectedMember ? shifts.filter((s) => s.memberName === selectedMember) : [];
  const memberInfo = members.find((m) => m.name === selectedMember);

  const handleSaveLineId = async () => {
    if (!memberInfo) return;
    setSavingLineId(true);
    try {
      await updateMemberLineId(memberInfo.id, lineIdDraft);
      toast.show('LINE IDを保存しました', 'success');
    } catch (e) {
      toast.show(`保存失敗: ${(e as Error).message}`, 'error');
    } finally {
      setSavingLineId(false);
    }
  };

  const sortTabs: { id: SortKey; label: string; icon: typeof MapPin }[] = [
    { id: 'weekday', label: '曜日', icon: CalendarDays },
    { id: 'place', label: '場所', icon: MapPin },
    { id: 'time', label: '時間', icon: Clock },
    { id: 'name', label: '名前', icon: UserIcon },
    { id: 'headcount', label: '人数', icon: Hash },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900">シフト調整</h1>
          <p className="text-sm text-gray-500">申請の許可・否認・調整を行います {planCount > 0 && <span className="text-amber-600 font-medium">未処理 {planCount}件</span>}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMembersOpen(true)}>
            <Users className="w-4 h-4" />名簿
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setLogOpen(true)}>
            <History className="w-4 h-4" />復元ログ
          </Button>
        </div>
      </div>

      {/* ソートタブ + フィルタ */}
      <Card className="p-3 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500 shrink-0">並替:</span>
          <div className="flex gap-1 flex-wrap">
            {sortTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setSortKey(t.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${sortKey === t.id ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <t.icon className="w-3.5 h-3.5" />{t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="w-auto">
            <option value="plan">予定のみ</option>
            <option value="confirmed">確定のみ</option>
            <option value="all">すべて</option>
          </Select>
          <Input placeholder="名前・件名・場所で検索" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[160px]" />
        </div>
      </Card>

      {/* シフト一覧 */}
      {filtered.length === 0 ? (
        <Card className="p-6"><EmptyState icon={<CheckCircle2 className="w-10 h-10" />} title="該当するシフトはありません" /></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const isToday = s.date === todayStr();
            return (
              <Card key={s.id} className="p-4 hover:shadow-cardLg transition">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge color={s.status === 'confirmed' ? 'confirmed' : 'plan'}>{s.status === 'confirmed' ? '確定' : '予定'}</Badge>
                      {isToday && <Badge color="today">当日</Badge>}
                      <span className={`text-sm font-medium ${weekdayJP(s.date) === '日' ? 'text-red-500' : weekdayJP(s.date) === '土' ? 'text-blue-500' : 'text-gray-700'}`}>
                        {formatDateJP(s.date)}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">{s.memberName} · {s.subject}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
                      {s.timeType === 'time' && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.timeStart}〜{s.timeEnd}</span>
                      )}
                      {s.place && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.place}</span>}
                      {s.headcount && <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{s.headcount}人</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">申請 {formatDateTimeJP(s.createdAt)} / 修正 {formatDateTimeJP(s.updatedAt)} / v{s.version}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {s.status === 'plan' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => doApprove(s)}><CheckCircle2 className="w-4 h-4" />許可</Button>
                        <Button size="sm" variant="danger" onClick={() => doDeny(s)}><XCircle className="w-4 h-4" />否認</Button>
                        <Button size="sm" variant="secondary" onClick={() => openAdjust(s)}><Sliders className="w-4 h-4" />調整</Button>
                      </>
                    )}
                    {s.status === 'confirmed' && (
                      <Button size="sm" variant="secondary" onClick={() => openAdjust(s)}><Sliders className="w-4 h-4" />再調整</Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 調整モーダル */}
      <Modal
        open={adjusting !== null}
        onClose={() => setAdjusting(null)}
        title="シフト調整"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdjusting(null)}>キャンセル</Button>
            <Button variant="success" onClick={doAdjust}>調整して確定</Button>
          </>
        }
      >
        {adjusting && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{adjusting.memberName} · {formatDateJP(adjusting.date)}</p>
            {adjusting.timeType !== 'none' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">開始</label>
                  <Input type="time" value={adjTimeStart} onChange={(e) => setAdjTimeStart(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">終了</label>
                  <Input type="time" value={adjTimeEnd} onChange={(e) => setAdjTimeEnd(e.target.value)} />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">件名</label>
              <Input value={adjSubject} onChange={(e) => setAdjSubject(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">場所</label>
              <Select value={adjPlace} onChange={(e) => setAdjPlace(e.target.value)}>
                <option value="">指定なし</option>
                {PLACE_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>
          </div>
        )}
      </Modal>

      {/* 名簿モーダル */}
      <Modal open={membersOpen} onClose={() => { setMembersOpen(false); setSelectedMember(null); }} title="名簿">
        {!selectedMember ? (
          <div className="space-y-1">
            {members.length === 0 ? (
              <EmptyState icon={<Users className="w-8 h-8" />} title="メンバーがいません" />
            ) : (
              members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMember(m.name); setLineIdDraft(m.lineUserId ?? ''); }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                    <span className="text-sm font-medium text-gray-800">{m.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${m.lineUserId ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {m.lineUserId ? 'LINE済' : '未登録'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">記入 {new Date(m.createdAt).toLocaleDateString()}</span>
                </button>
              ))
            )}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelectedMember(null)} className="text-xs text-brand-600 mb-3 flex items-center gap-1">
              <ChevronDown className="w-3 h-3 rotate-90" />名簿に戻る
            </button>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{selectedMember}</h3>
              {memberInfo?.lineUserId && (
                <a
                  href={`https://line.me/ti/p/~${memberInfo.lineUserId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg hover:bg-green-100"
                >
                  <MessageCircle className="w-3.5 h-3.5" />LINEへ
                </a>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-400">記入日</p>
                <p className="text-gray-700 font-medium">{memberInfo ? formatDateTimeJP(memberInfo.createdAt) : '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-gray-400">最終更新日</p>
                <p className="text-gray-700 font-medium">{memberInfo ? formatDateTimeJP(memberInfo.updatedAt) : '—'}</p>
              </div>
            </div>
            {/* LINE ID 表示・手動設定 */}
            <div className="mb-3 p-3 rounded-lg bg-gray-50 text-xs">
              <p className="text-gray-400 mb-1">LINE ID</p>
              <p className="text-gray-600 font-mono break-all mb-2">{memberInfo?.lineUserId ?? '未登録'}</p>
              <div className="flex gap-2">
                <Input
                  value={lineIdDraft}
                  onChange={(e) => setLineIdDraft(e.target.value)}
                  placeholder="U000...（手動設定）"
                  className="text-xs flex-1"
                />
                <Button size="sm" variant="secondary" onClick={handleSaveLineId} disabled={savingLineId}>
                  {savingLineId ? '…' : '保存'}
                </Button>
              </div>
            </div>
            <p className="text-xs font-medium text-gray-600 mb-2">申請履歴</p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {memberShifts.length === 0 ? (
                <p className="text-sm text-gray-400">申請なし</p>
              ) : (
                memberShifts.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded bg-gray-50">
                    <span className="flex items-center gap-1.5">
                      <Badge color={s.status === 'confirmed' ? 'confirmed' : 'plan'}>{s.status === 'confirmed' ? '確' : '予'}</Badge>
                      {formatDateJP(s.date)} · {s.subject}
                    </span>
                    <span className="text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 復元ログモーダル */}
      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="承認ログ（7日以内復元可）">
        {approvalLogs.length === 0 ? (
          <EmptyState icon={<History className="w-8 h-8" />} title="承認ログはありません" />
        ) : (
          <div className="space-y-2">
            {approvalLogs.map((log) => {
              const expired = !isPast7Days(log.createdAt);
              const before = log.beforeState;
              return (
                <div key={log.id} className="p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge color={log.action === 'approve' ? 'confirmed' : log.action === 'deny' ? 'red' : 'blue'}>
                        {log.action === 'approve' ? '許可' : log.action === 'deny' ? '否認' : '調整'}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatDateTimeJP(log.createdAt)}</span>
                    </div>
                    <Button size="sm" variant="ghost" disabled={expired} onClick={() => doRestore(log)}>
                      <RotateCcw className="w-3.5 h-3.5" />復元
                    </Button>
                  </div>
                  {before && (
                    <p className="text-xs text-gray-600">
                      {before.memberName} · {formatDateJP(before.date)} · {before.subject} ({before.status === 'confirmed' ? '確定' : '予定'})
                    </p>
                  )}
                  {expired && <p className="text-[10px] text-gray-400 mt-1">7日経過のため復元不可</p>}
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
