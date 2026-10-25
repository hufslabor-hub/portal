import 'server-only';
import { createHmac } from 'node:crypto';

/**
 * 익명 게시판용 작성자 표식. 회원 ID를 비밀 키로 해시한 값만 저장하므로
 * 데이터베이스만 봐서는 누가 썼는지 알 수 없고, 본인 글 삭제 여부 확인에만 쓰임.
 * (비밀 키: ANON_SECRET 환경변수, 없으면 Firebase 비공개 키 사용)
 */
export const anonHash = (uid: string) =>
  createHmac('sha256', process.env.ANON_SECRET ?? process.env.FIREBASE_PRIVATE_KEY ?? 'dev').update(uid).digest('hex').slice(0, 24);

export const kst = (ms: number) =>
  new Date(ms).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', year: '2-digit', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
