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
