// 업로드 허용 규칙 (서버·브라우저 공용). 확장자 → 허용 MIME 타입. SVG·HTML·실행파일·압축파일은 의도적으로 제외.
export const MIME: Record<string, string[]> = {
  pdf: ['application/pdf'],
  png: ['image/png'], jpg: ['image/jpeg'], jpeg: ['image/jpeg'], gif: ['image/gif'], webp: ['image/webp'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  hwp: ['application/x-hwp', 'application/octet-stream'],
  hwpx: ['application/x-hwpx', 'application/octet-stream'],
};
export const MAX_BYTES = 30 * 1024 * 1024;
export const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';
