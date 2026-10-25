/**
 * 홈페이지 '조합원 찾기'용 명단 API (구글 Apps Script).
 * 기존 코드(doGet 등)는 그대로 두고 이 파일 내용을 새 파일로 추가하세요.
 * 스크립트 속성에 SITE_API_KEY(길고 무작위인 문자열)를 등록해야 응답합니다.
 */
const MEMBERS_SHEET_ID = '1P2EmP2TFQ1o3uZDRCwzaBNYNe7wDnBlY';
const MEMBERS_SHEET_NAME = '조합원(전체)';
const NAME_KEYS = ['이름', '성명'];
const DEPT_KEYS = ['소속', '부서'];

function doPost(e) {
  try {
    const key = PropertiesService.getScriptProperties().getProperty('SITE_API_KEY');
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!key || body.key !== key) return apiJson_({ error: 'unauthorized' });

    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(MEMBERS_SHEET_ID);
    const sh = ss.getSheetByName(MEMBERS_SHEET_NAME);
    if (!sh) return apiJson_({ error: 'sheet-not-found' });
    const rows = sh.getDataRange().getDisplayValues();

    // 제목 줄 찾기(위 5줄 안에서 '이름' 칸이 있는 줄)
    const col = (hdr, keys) => hdr.findIndex(h => keys.some(k => String(h).replace(/\s/g, '').indexOf(k) >= 0));
    let h = -1, ni = -1, di = -1;
    for (let r = 0; r < Math.min(5, rows.length) && ni < 0; r++) {
      ni = col(rows[r], NAME_KEYS); di = col(rows[r], DEPT_KEYS); h = r;
    }
    if (ni < 0) return apiJson_({ error: 'name-column-not-found', headers: rows[0] });

    const members = [];
    for (let r = h + 1; r < rows.length; r++) {
      const name = String(rows[r][ni]).trim();
      if (name) members.push({ name: name, dept: di >= 0 ? String(rows[r][di]).trim() : '' });
    }
    return apiJson_({ members: members });
  } catch (err) {
    return apiJson_({ error: 'server-error' });
  }
}

function apiJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
