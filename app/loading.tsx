// 화면을 옮기는 동안 잠깐 보이는 자리 표시(깜빡임 완화)
export default function Loading() {
  return (
    <main aria-busy="true" aria-label="불러오는 중">
      <div className="wrap">
        <div className="skel skel-title" />
        <div className="skel" /><div className="skel" /><div className="skel" style={{ width: '70%' }} />
      </div>
    </main>
  );
}
