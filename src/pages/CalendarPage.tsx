// / ユーザーカレンダー: 全ユーザーのシフトを月表示で重ねて表示、予定/確定タグを色分け

import { useMemo, useState } from 'react';
import { UserLayout } from '../components/UserLayout';
import { MonthCalendar, DayShiftList } from '../components/MonthCalendar';
import { useData } from '../contexts/DataContext';
import { Modal } from '../components/ui';
import { formatDateJP } from '../lib/utils';

export function CalendarPage() {
  const { shifts } = useData();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedShifts = useMemo(
    () => (selected ? shifts.filter((s) => s.date === selected) : []),
    [shifts, selected],
  );

  return (
    <UserLayout>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">シフトカレンダー</h1>
        <p className="text-sm text-gray-500">全メンバーのシフトを確認できます</p>
      </div>
      <MonthCalendar shifts={shifts} onSelectDate={setSelected} />

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
