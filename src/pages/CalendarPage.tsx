// / ユーザーカレンダー: 全ユーザーのシフトを月表示。名前・ステータスでフィルタ可能

import { useMemo, useState } from 'react';
import { UserLayout } from '../components/UserLayout';
import { MonthCalendar, DayShiftList } from '../components/MonthCalendar';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Modal, Select } from '../components/ui';
import { formatDateJP } from '../lib/utils';

export function CalendarPage() {
  const { shifts, members } = useData();
  const { name: myName } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [filterName, setFilterName] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'plan' | 'confirmed'>('all');

  const filtered = useMemo(() => {
    let list = shifts;
    if (filterName !== 'all') list = list.filter((s) => s.memberName === filterName);
    if (filterStatus !== 'all') list = list.filter((s) => s.status === filterStatus);
    return list;
  }, [shifts, filterName, filterStatus]);

  const selectedShifts = useMemo(
    () => (selected ? filtered.filter((s) => s.date === selected) : []),
    [filtered, selected],
  );

  // メンバーリスト: Firestoreのmembersに加え、shiftsに存在する名前も追加
  const memberNames = useMemo(() => {
    const fromMembers = members.map((m) => m.name);
    const fromShifts = [...new Set(shifts.map((s) => s.memberName))];
    return [...new Set([...fromMembers, ...fromShifts])].sort((a, b) => a.localeCompare(b, 'ja'));
  }, [members, shifts]);

  return (
    <UserLayout>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">シフトカレンダー</h1>
        <p className="text-sm text-gray-500">全メンバーのシフトを確認できます</p>
      </div>

      {/* フィルタバー */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Select
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="w-auto text-sm"
        >
          <option value="all">全員</option>
          <option value={myName ?? ''}>自分（{myName}）</option>
          {memberNames.filter((n) => n !== myName).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </Select>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="w-auto text-sm"
        >
          <option value="all">予定＋確定</option>
          <option value="plan">予定のみ</option>
          <option value="confirmed">確定のみ</option>
        </Select>
      </div>

      <MonthCalendar shifts={filtered} onSelectDate={setSelected} />

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? formatDateJP(selected) : ''}
      >
        {selected && <DayShiftList date={selected} shifts={selectedShifts} />}
      </Modal>
    </UserLayout>
  );
}
