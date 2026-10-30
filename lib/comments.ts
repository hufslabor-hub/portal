import 'server-only';
import { createHash } from 'node:crypto';
import { db } from './firebase';

export const MAX_COMMENT = 1000;

/**
 * 글 하나(scope + postId)마다 문서 하나를 두고, 그 아래 items 에 댓글을 저장합니다.
 *   post_comments/{해시}/items/{댓글ID} : { body, authorHash, createdAt, editedAt? }
 * postId 가 어떤 문자열이어도 안전하도록 문서 ID는 해시로 만들고, 글마다 따로 정렬해서 읽습니다.
 */
export const itemsRef = (scope: string, postId: string) =>
  db().collection('post_comments').doc(createHash('sha256').update(`${scope}|${postId}`).digest('hex').slice(0, 40)).collection('items');

export const okScope = (s: string) => /^[a-z][a-z0-9-]{0,30}$/.test(s);
export const okPostId = (s: string) => s.length > 0 && s.length <= 200;
export const okCommentId = (s: string) => /^[A-Za-z0-9]{10,40}$/.test(s);

/** 등록 뒤 돌아갈 주소: 이 사이트 안의 경로만 허용 (외부 주소로 보내는 것을 막음) */
export const safePath = (p: string) => (/^\/(?!\/)[^\s\\]{0,300}$/.test(p) ? p : '/');
