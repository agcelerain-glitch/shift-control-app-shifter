// データコンテキスト: Firestore(onSnapshot)/モックのリアルタイム購読を一括管理

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  subscribeMembers,
  subscribeShifts,
  subscribeBoardPublic,
  subscribeBoardPrivate,
  subscribeApprovalLogs,
} from '../lib/db';
import type { Member, Shift, BoardPublic, BoardPrivate, ApprovalLog } from '../lib/types';

interface DataCtx {
  members: Member[];
  shifts: Shift[];
  boardPublic: BoardPublic[];
  boardPrivate: BoardPrivate[];
  approvalLogs: ApprovalLog[];
  loaded: boolean;
}

const Ctx = createContext<DataCtx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [boardPublic, setBoardPublic] = useState<BoardPublic[]>([]);
  const [boardPrivate, setBoardPrivate] = useState<BoardPrivate[]>([]);
  const [approvalLogs, setApprovalLogs] = useState<ApprovalLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubs = [
      subscribeMembers(setMembers),
      subscribeShifts(setShifts),
      subscribeBoardPublic(setBoardPublic),
      subscribeBoardPrivate(setBoardPrivate),
      subscribeApprovalLogs(setApprovalLogs),
    ];
    setLoaded(true);
    return () => unsubs.forEach((u) => u());
  }, []);

  return (
    <Ctx.Provider value={{ members, shifts, boardPublic, boardPrivate, approvalLogs, loaded }}>
      {children}
    </Ctx.Provider>
  );
}

export function useData(): DataCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData must be used within DataProvider');
  return v;
}
