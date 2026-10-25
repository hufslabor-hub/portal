# HUFS UNION portal

Next.js + Firestore(Admin SDK) + Vercel.

## 데이터 구조
- `posts/{id}`: title, category(news|notice|bargaining|letter|forms), body(Markdown), published(bool), createdAt(Timestamp), files[{name,url(https)}]
- `pages/{slug}`: title, body(Markdown) — slug: about, history, officers, agreement, bylaws

## 실행
1. Firebase 서비스 계정 키로 `.env.local` 작성 (`.env.example` 참고)
2. `firebase deploy --only firestore:rules` (전면 차단 규칙)
3. `npm install && npm run dev`
4. Vercel에 같은 환경변수 3개를 등록하고 배포

## 관리자 설정
1. Firebase 콘솔 → Authentication → 이메일/비밀번호 로그인 사용 설정, 관리자 계정 생성
2. 프로젝트 설정의 웹 API 키를 `FIREBASE_WEB_API_KEY`에 입력 (Vercel에도 등록)
3. `node --env-file=.env.local scripts/make-admin.mjs 관리자이메일`
4. `/admin` 접속

## 첨부파일 (Vercel Blob)
1. Vercel → Storage에서 Blob 저장소(Public)를 만들고 프로젝트에 연결
2. `npm install @vercel/blob`
3. 저장소 화면의 `.env.local` 탭 값을 `.env.local`에 복사 (Vercel 프로젝트에는 자동 등록됨)
4. 기존 파일 이전: `node --env-file=.env.local scripts/migrate_files.mjs seed.json seed.migrated.json` → `node --env-file=.env.local scripts/seed.mjs seed.migrated.json`
- 업로드된 파일은 주소를 아는 누구나 열 수 있습니다. 비공개 문서는 올리지 마세요.

## 조합원 기능 (메뉴 관리 · 조합원 찾기 · 자유게시판 · 그룹챗)
- 관리자 화면 → **메뉴 관리**에서 상위/하위 메뉴를 추가·수정·삭제·순서 변경
- 이미 승인된 조합원을 '조합원 찾기' 목록에 넣기: `node --env-file=.env.local scripts/sync_members.mjs` (이후 승인하는 사람은 자동 등록)
- 자유게시판 작성자 표식용 비밀 키: 환경변수 `ANON_SECRET`(임의의 긴 문자열)을 Vercel에 등록 권장. 없으면 Firebase 비공개 키를 대신 사용
- 오래된 기록 자동 삭제: Firestore TTL 정책을 `chat_messages`, `ratelimits` 컬렉션의 `expireAt` 필드에 설정(선택)
