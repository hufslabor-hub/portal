import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

const OK_EXT = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'docx', 'xlsx', 'pptx', 'hwp', 'hwpx', 'zip'];

// 관리자만 업로드 토큰을 받을 수 있음. 파일은 브라우저에서 Blob으로 직접 올라감(4.5MB 제한 없음).
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body, request,
      token: process.env.hufslabor_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        await requireAdmin();
        const ext = pathname.split('.').pop()?.toLowerCase() ?? '';
        if (!pathname.startsWith('uploads/') || !OK_EXT.includes(ext)) throw new Error('허용되지 않는 파일입니다.');
        return { maximumSizeInBytes: 30 * 1024 * 1024, addRandomSuffix: true };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
