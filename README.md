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

## 첨부파일 (Firebase Storage)
1. 콘솔에서 Storage를 시작하고(Blaze 요금제 필요), 버킷 이름을 `FIREBASE_STORAGE_BUCKET`에 입력 (Vercel에도 등록)
2. `cors.json`의 도메인을 고친 뒤 `gcloud storage buckets update gs://버킷이름 --cors-file=cors.json`
3. 기존 파일 이전: `node --env-file=.env.local scripts/migrate_files.mjs seed.json seed.migrated.json` → `node --env-file=.env.local scripts/seed.mjs seed.migrated.json`
- 업로드된 파일은 주소를 아는 누구나 열 수 있습니다. 비공개 문서는 올리지 마세요.
