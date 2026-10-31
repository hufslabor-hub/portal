import 'server-only';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from './firebase';

/** 관리자 작업 기록(누가 · 언제 · 무엇을). Firestore audit_logs 컬렉션에 서버만 쓰고 읽습니다. */
export type AuditAction = 'admin_grant' | 'admin_revoke' | 'member_edit' | 'home_edit' | 'home_reset';
export type AuditEntry = { actorUid: string; actorEmail: string; action: AuditAction; targetUid?: string; targetEmail?: string; detail?: string };
export type AuditRow = { id: string; at: number; actorEmail: string; action: AuditAction; targetEmail: string; detail: string };

export const AUDIT_LABEL: Record<AuditAction, string> = {
  admin_grant: '관리자 지정', admin_revoke: '관리자 해제', member_edit: '조합원 정보 수정', home_edit: '메인 문구 수정', home_reset: '메인 문구 초기화',
};

/** 기록 실패가 본 작업을 막지는 않지만 서버 로그에 남깁니다. */
export async function logAudit(e: AuditEntry): Promise<void> {
  try {
    await db().collection('audit_logs').add({
      actorUid: e.actorUid, actorEmail: e.actorEmail.slice(0, 200), action: e.action,
      targetUid: e.targetUid ?? '', targetEmail: (e.targetEmail ?? '').slice(0, 200), detail: (e.detail ?? '').slice(0, 600),
      at: Timestamp.now(),
    });
  } catch (err) {
    console.error('audit log failed', err);
  }
}

export async function recentAudit(n = 20): Promise<AuditRow[]> {
  const s = await db().collection('audit_logs').orderBy('at', 'desc').limit(n).get();
  return s.docs.map((d) => {
    const v = d.data();
    return { id: d.id, at: v.at?.toMillis?.() ?? 0, actorEmail: String(v.actorEmail ?? ''), action: v.action as AuditAction, targetEmail: String(v.targetEmail ?? ''), detail: String(v.detail ?? '') };
  });
}
