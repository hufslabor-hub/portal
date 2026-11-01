export const metadata = { title: '앱으로 설치' };

export default function Install() {
  return (
    <main><div className="wrap narrow">
      <h1 className="pt">앱으로 설치하기</h1>
      <p className="meta" style={{ whiteSpace: 'normal' }}>앱스토어 없이, 지금 보시는 홈페이지를 휴대폰 홈 화면에 앱처럼 추가할 수 있습니다. 설치 후에는 주소창 없이 열리고, 내용은 자동으로 최신 상태가 됩니다.</p>

      <h2 className="sec">아이폰 (사파리)</h2>
      <ol className="prose">
        <li><b>사파리</b>에서 이 사이트를 엽니다. 카카오톡·인스타그램 안에서 열었다면 오른쪽 아래(또는 위) 메뉴에서 <b>Safari로 열기</b>를 먼저 누르세요.</li>
        <li>화면 아래의 <b>공유 버튼</b>(네모에서 화살표가 나가는 모양)을 누릅니다.</li>
        <li><b>홈 화면에 추가</b>를 누릅니다. 목록에 안 보이면 맨 아래 <b>더보기</b>(또는 스크롤)에서 찾아 주세요.</li>
        <li>오른쪽 위 <b>추가</b>를 누르면 홈 화면에 <b>HUFS UNION</b> 아이콘이 생깁니다.</li>
      </ol>

      <h2 className="sec">안드로이드 (크롬)</h2>
      <ol className="prose">
        <li><b>크롬</b>에서 이 사이트를 엽니다.</li>
        <li>오른쪽 위 <b>⋮ 메뉴</b>를 누릅니다.</li>
        <li><b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 누르고 안내에 따라 추가합니다.</li>
      </ol>

      <h2 className="sec">알아 두세요</h2>
      <ul className="prose">
        <li>앱으로 처음 열면 <b>로그인을 한 번 더</b> 해야 할 수 있습니다. 사파리와 홈 화면 앱은 로그인 정보를 따로 보관합니다.</li>
        <li>알림(푸시)은 아직 지원하지 않습니다.</li>
        <li>지우려면 홈 화면에서 아이콘을 길게 눌러 삭제하면 됩니다.</li>
      </ul>
    </div></main>
  );
}
