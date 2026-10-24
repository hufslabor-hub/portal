import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

const OK_EXT = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'docx', 'xlsx', 'pptx', 'hwp', 'hwpx', 'zip'];
const envEnding = (suffix: string) =>
  Object.entries(process.env).find(([k, v]) => k.endsWith(suffix) && v)?.[1];

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  const token = envEnding('READ_WRITE_TOKEN');
  const storeId = envEnding('STORE_ID');
  try {
    const json = await handleUpload({
      body, request,
      ...(token ? { token } : {}),
      ...(storeId ? { storeId } : {}),
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
    console.error('upload token error', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}