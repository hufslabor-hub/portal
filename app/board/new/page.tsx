import { requireSession } from '@/lib/auth';
import { createPost } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: '글쓰기 - 자유게시판' };

export default async function NewPost() {
  await requireSession('/board/new');
  return (
    <main><div className="wrap narrow">
      <h1 className="pt">자유게시판 글쓰기</h1>
      <p className="meta" style={{ whiteSpace: 'normal' }}>작성자는 다른 조합원에게 ‘익명’으로 표시됩니다. 특정인을 비방하거나 개인정보를 올리면 관리자가 삭제할 수 있습니다.</p>
      <form action={createPost} className="form">
        <label>제목<input name="title" maxLength={100} required /></label>
        <label>내용<textarea name="body" rows={10} maxLength={3000} required /></label>
        <button className="btn">올리기</button>
      </form>
    </div></main>
  );
}
