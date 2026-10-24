import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { blobToken } from '@/lib/blob';
import { MAX_BYTES, MIME, extOf } from '@/lib/upload-rules';

// 관리자만 업로드 토큰을 받음. 확장자와 MIME 타입이 모두 허용 목록에 맞아야 하고, 크기는 30MB 이하.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  const token = blobToken();
  try {
    const json = await handleUpload({
      body, request, ...(token ? { token } : {}),
      onBeforeGenerateToken: async (pathname) => {
        await requireAdmin();
        const ext = extOf(pathname);
        if (!pathname.startsWith('uploads/') || !(ext in MIME)) throw new Error('허용되지 않는 파일입니다.');
        return { allowedContentTypes: MIME[ext], maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    console.error('upload token error', e);
    return NextResponse.json({ error: '업로드를 시작할 수 없습니다.' }, { status: 400 });
  }
}
