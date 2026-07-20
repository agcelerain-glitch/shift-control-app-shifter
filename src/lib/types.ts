// 共通データ型定義: FirestoreモデルとUI間で共有する型

export type Role = 'user' | 'admin';

export type ShiftStatus = 'plan' | 'confirmed' | 'reviewed';
export type TimeType = 'none' | 'time' | 'template' | 'other';
export type TemplateCode = 'A' | 'B' | 'C' | 'D';

// members: 名簿
export interface Member {
  id: string;
  name: string;
  createdAt: number; // 記入日
  updatedAt: number; // 最終更新日
  lineUserId?: string;
}

// shifts: シフト申請・確定
export interface Shift {
  id: string;
  memberName: string;
  date: string; // YYYY-MM-DD
  status: ShiftStatus;
  timeType: TimeType;
  timeStart?: string; // HH:mm
  timeEnd?: string; // HH:mm
  template?: TemplateCode;
  subject: string; // 件名
  place?: string;
  headcount?: number;
  createdAt: number; // 申請日
  updatedAt: number; // 最終修正日
  version: number; // 楽観ロック
}

// boardPublic: 全体掲示板
export interface BoardPublic {
  id: string;
  title: string;
  body: string;
  adminName: string;
  createdAt: number;
}

// boardPrivate: admin非公開メモ/通知
export interface BoardPrivate {
  id: string;
  adminName: string;
  body: string;
  type: 'memo' | 'notification';
  createdAt: number;
}

// approvalLogs: 承認ログ（7日復元用）
export interface ApprovalLog {
  id: string;
  shiftId: string;
  beforeState: Shift | null;
  action: 'approve' | 'deny' | 'adjust';
  adminName: string;
  createdAt: number;
}

export const TEMPLATE_LABELS: Record<TemplateCode, string> = {
  A: 'A帯',
  B: 'B帯',
  C: 'C帯',
  D: 'D帯',
};

export const TEMPLATE_TIMES: Record<TemplateCode, { start: string; end: string }> = {
  A: { start: '09:00', end: '13:00' },
  B: { start: '13:00', end: '17:00' },
  C: { start: '17:00', end: '21:00' },
  D: { start: '21:00', end: '25:00' },
};
