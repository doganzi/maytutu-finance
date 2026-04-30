/**
 * Maytutu Finance — 시드 데이터 자동 입력 Apps Script
 *
 * 사용법:
 * 1. createAllSheets() 먼저 실행 (22시트 헤더 생성)
 * 2. 본 파일 붙여넣기 (별도 .gs 파일로)
 * 3. seedAllMasters() 실행
 *
 * 결과:
 * - 법인 2건 (메이투투·앙호두)
 * - 사용자 placeholder (Admin 계정 등록용)
 * - 세율 7건 (한국 VAT/원천세 + 필리핀/베트남 VAT)
 * - BU채널 11건
 * - 시드 = 빈 행이 아닌 실제 운영 데이터 시작점
 *
 * @version 1.0 (2026-04-29)
 */

function seedAllMasters() {
  seedLegalEntities();
  seedTaxRates();
  seedBuChannels();
  seedUsersPlaceholder();
  SpreadsheetApp.getUi().alert('✓ 시드 데이터 입력 완료\n\n다음 단계:\n1. 사용자 시트에 11명+ 본사 계정 등록\n2. 거래처·점포·계약은 CSV import 또는 화면에서 입력');
}

// ─── 법인 2건 ──────────────────────────────────────
function seedLegalEntities() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('법인');
  if (!sheet) { Logger.log('[skip] 법인 시트 없음'); return; }
  if (sheet.getLastRow() > 1) { Logger.log('[skip] 법인 데이터 이미 있음'); return; }

  const rows = [
    [
      'MAYTUTU',                    // corp_id
      '__BIZNO_PARENT__',           // biz_no — 사용자 입력 (사업자등록증)
      '주식회사 메이투투',          // name_ko
      'Maytutu Inc.',               // name_en
      '',                           // parent_corp_id (모회사)
      '__CEO_NAME__',               // ceo_name — 사용자 입력
      '__HQ_ADDRESS__',             // hq_address — 사용자 입력
      '',                           // tax_office
      '',                           // bank_main
      '',                           // account_main
      '__ESTABLISH_DATE__',         // establish_date
      '운영중',                     // status
      makeAuditNote('seed', '초기 시드'),
    ],
    [
      'ANGHODU',                    // corp_id
      '__BIZNO_SUB__',              // biz_no — 사용자 입력
      '주식회사 앙호두',            // name_ko
      'Anghodu Co.,Ltd.',           // name_en
      'MAYTUTU',                    // parent_corp_id (자회사)
      '__CEO_NAME__',               // ceo_name
      '',                           // hq_address
      '',                           // tax_office
      '',                           // bank_main
      '',                           // account_main
      '',                           // establish_date
      '운영중',                     // status
      makeAuditNote('seed', '초기 시드 - 자회사'),
    ],
  ];

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  Logger.log(`[seed] 법인 ${rows.length}건`);
}

// ─── 세율 7건 ──────────────────────────────────────
function seedTaxRates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('세율');
  if (!sheet) { Logger.log('[skip] 세율 시트 없음'); return; }
  if (sheet.getLastRow() > 1) { Logger.log('[skip] 세율 데이터 이미 있음'); return; }

  const today = formatDateForSheet(new Date());
  const rows = [
    ['KR_VAT_10',     'KR', 'VAT', 10,  '2024-01-01', '', '한국 일반 부가세',                 true, makeAuditNote('seed', '한국 표준 VAT')],
    ['KR_VAT_0',      'KR', 'VAT',  0,  '2024-01-01', '', '한국 영세율 (수출 등)',           true, makeAuditNote('seed', '영세율')],
    ['KR_WH_3.3',     'KR', 'WH',   3.3,'2024-01-01', '', '사업소득 원천세 (3% + 지방소득세 0.3%)', true, makeAuditNote('seed', '사업소득')],
    ['KR_WH_8.8',     'KR', 'WH',   8.8,'2024-01-01', '', '기타소득 원천세 (8% + 지방소득세 0.8%)', true, makeAuditNote('seed', '기타소득')],
    ['KR_WH_22',      'KR', 'WH',  22,  '2024-01-01', '', '기타소득 (22%) - 일시강의 등',     true, makeAuditNote('seed', '기타소득 22%')],
    ['PH_VAT_12',     'PH', 'VAT', 12,  '2024-01-01', '', '필리핀 부가세',                   true, makeAuditNote('seed', '필리핀 진출')],
    ['VN_VAT_10',     'VN', 'VAT', 10,  '2024-01-01', '', '베트남 부가세',                   true, makeAuditNote('seed', '베트남 진출')],
    ['JP_CT_10',      'JP', 'VAT', 10,  '2024-01-01', '', '일본 소비세 (Consumption Tax)',   true, makeAuditNote('seed', '일본 진출')],
  ];

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  Logger.log(`[seed] 세율 ${rows.length}건`);
}

// ─── BU채널 11건 ────────────────────────────────────
function seedBuChannels() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('BU채널');
  if (!sheet) { Logger.log('[skip] BU채널 시트 없음'); return; }
  if (sheet.getLastRow() > 1) { Logger.log('[skip] BU채널 데이터 이미 있음'); return; }

  const rows = [
    // 메이투투 (모회사)
    ['HQ',           '본사 운영',           '',         'MAYTUTU', 'cost',    true, makeAuditNote('seed', '본사 운영비')],
    ['RND',          'R&D (TIPS 등)',       '',         'MAYTUTU', 'cost',    true, makeAuditNote('seed', '연구개발')],
    ['IP',           'IP 콘텐츠/굿즈',      '',         'MAYTUTU', 'both',    true, makeAuditNote('seed', '캐릭터·굿즈')],

    // 앙호두 (자회사)
    ['DIRECT',       '직영점',              '',         'ANGHODU', 'revenue', true, makeAuditNote('seed', '송도·간석점')],
    ['FC_ROYALTY',   '가맹-로열티',         '',         'ANGHODU', 'revenue', true, makeAuditNote('seed', 'POS×%')],
    ['FC_MATERIAL',  '가맹-식자재공급',     '',         'ANGHODU', 'revenue', true, makeAuditNote('seed', '본사→가맹')],
    ['FC_FEE',       '가맹-가맹비/교육비',  '',         'ANGHODU', 'revenue', true, makeAuditNote('seed', '1회성·정기')],
    ['FC_OTHER',     '가맹-부자재/기타',    '',         'ANGHODU', 'revenue', true, makeAuditNote('seed', '부자재 등')],

    // 글로벌
    ['GLB_PH',       '글로벌-필리핀',       '',         'ANGHODU', 'both',    true, makeAuditNote('seed', '마닐라·마카티')],
    ['GLB_VN',       '글로벌-베트남',       '',         'ANGHODU', 'both',    true, makeAuditNote('seed', '호치민')],
    ['GLB_JP',       '글로벌-일본',         '',         'ANGHODU', 'both',    true, makeAuditNote('seed', 'TokyoSundubu NDA')],
  ];

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  Logger.log(`[seed] BU채널 ${rows.length}건`);
}

// ─── 사용자 placeholder (Admin 계정 등록용) ───────────
function seedUsersPlaceholder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('사용자');
  if (!sheet) { Logger.log('[skip] 사용자 시트 없음'); return; }
  if (sheet.getLastRow() > 1) { Logger.log('[skip] 사용자 데이터 이미 있음'); return; }

  const rows = [
    // Admin 3명 (모두 placeholder — Apps Script 실행 후 사내에서 직접 정정)
    ['__admin1@anghodu.biz', '__ADMIN_1_NAME__', 'admin', '__POSITION__', '', true, '', makeAuditNote('seed', 'Admin 1 - 정정 필요')],
    ['__admin2@anghodu.biz', '__ADMIN_2_NAME__', 'admin', '__POSITION__', '', true, '', makeAuditNote('seed', 'Admin 2 - 정정 필요')],
    ['__admin3@anghodu.biz', '__ADMIN_3_NAME__', 'admin', '__POSITION__', '', true, '', makeAuditNote('seed', 'Admin 3 - 정정 필요')],
  ];

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  Logger.log(`[seed] 사용자 ${rows.length}건 (Admin placeholder, 이메일 정정 필요)`);
}

// ─── 환율 시드 (선택 - 한국은행 API 연동 전 더미) ────
function seedFxRates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('환율');
  if (!sheet) return;
  if (sheet.getLastRow() > 1) { Logger.log('[skip] 환율 데이터 이미 있음'); return; }

  const today = formatDateForSheet(new Date());
  const rows = [
    [today, 'USD', 1380, '수기',    '매매기준율', makeAuditNote('seed', '시작값 - 한국은행 API 연동 시 자동 갱신')],
    [today, 'JPY', 9.2,  '수기',    '매매기준율', makeAuditNote('seed', '시작값')],
    [today, 'PHP', 24.5, '수기',    '매매기준율', makeAuditNote('seed', '필리핀 페소')],
    [today, 'VND', 0.055,'수기',    '매매기준율', makeAuditNote('seed', '베트남 동')],
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  Logger.log(`[seed] 환율 ${rows.length}건`);
}

// ─── 기본 계정과목 (K-GAAP 표준 일부) ─────────────────
function seedAccountsBasic() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('계정과목');
  if (!sheet) return;
  if (sheet.getLastRow() > 1) { Logger.log('[skip] 계정과목 데이터 이미 있음'); return; }

  // 한국 일반기업회계기준 핵심 계정과목 30건 (전체 200~300건은 별도 CSV import)
  const rows = [
    // 자산
    ['1010', '현금',         '자산', '101', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['1020', '보통예금',     '자산', '101', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['1030', '정기예금',     '자산', '101', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['1110', '외상매출금',   '자산', '110', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['1120', '받을어음',     '자산', '110', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['1130', '미수금',       '자산', '110', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['1140', '선급금',       '자산', '110', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['1150', '선급비용',     '자산', '110', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['1210', '재고자산',     '자산', '120', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['1310', '비품',         '자산', '130', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['1320', '기계장치',     '자산', '130', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['1330', '차량운반구',   '자산', '130', '', '', '과세',  true, makeAuditNote('seed', '')],

    // 부채
    ['2110', '외상매입금',   '부채', '210', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['2120', '미지급금',     '부채', '210', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['2130', '예수보증금',   '부채', '210', '', '', '과세',  true, makeAuditNote('seed', '가맹점 보증금')],
    ['2140', '선수금',       '부채', '210', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['2150', '미지급비용',   '부채', '210', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['2160', '부가세예수금', '부채', '210', '', '', '과세',  true, makeAuditNote('seed', 'VAT 예수')],

    // 자본
    ['3010', '자본금',       '자본', '301', '', '', '면세',  true, makeAuditNote('seed', '')],
    ['3020', '이익잉여금',   '자본', '301', '', '', '면세',  true, makeAuditNote('seed', '')],

    // 수익
    ['4010', '매출액',       '수익', '401', '', '', '과세',  true, makeAuditNote('seed', '직영·가맹')],
    ['4020', '로열티수익',   '수익', '401', '', '', '과세',  true, makeAuditNote('seed', '가맹점 로열티')],
    ['4030', '가맹비수익',   '수익', '401', '', '', '과세',  true, makeAuditNote('seed', '1회성')],
    ['4090', '기타수익',     '수익', '401', '', '', '과세',  true, makeAuditNote('seed', '')],

    // 비용
    ['5010', '매출원가',     '비용', '501', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['5110', '급여',         '비용', '511', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['5120', '복리후생비',   '비용', '511', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['5210', '임차료',       '비용', '521', '', '', '과세',  true, makeAuditNote('seed', '본사·매장')],
    ['5310', '광고선전비',   '비용', '531', '', '', '과세',  true, makeAuditNote('seed', '')],
    ['5410', '지급수수료',   '비용', '541', '', '', '과세',  true, makeAuditNote('seed', '세무사·법무사 등')],
    ['5510', '운반비',       '비용', '551', '', '', '과세',  true, makeAuditNote('seed', '물류')],
  ];

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  Logger.log(`[seed] 계정과목 ${rows.length}건 (기본만, 전체는 CSV import)`);
}

// ════════════════════════════════════════════════════
// 유틸리티
// ════════════════════════════════════════════════════
function formatDateForSheet(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function makeAuditNote(action, reason) {
  const now = new Date();
  const ts = formatDateForSheet(now) + ' ' +
             String(now.getHours()).padStart(2, '0') + ':' +
             String(now.getMinutes()).padStart(2, '0');
  return `[${action}] ${reason || ''} | apps-script | ${ts}`;
}
