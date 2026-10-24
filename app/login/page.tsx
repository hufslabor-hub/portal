import LoginForm from '@/components/LoginForm';
import { safeNext } from '@/lib/auth';

export const metadata = { title: '조합원 로그인' };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main><div className="wrap narrow">
      <h1 className="pt">조합원 로그인</h1>
      <p className="meta">우리소식, 임단협뉴스, 단체협약, 규약은 로그인한 조합원만 볼 수 있습니다.</p>
      <LoginForm next={safeNext(next)} />
    </div></main>
  );
}
