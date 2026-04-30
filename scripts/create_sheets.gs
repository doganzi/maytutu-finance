/**
 * Maytutu Finance — 22개 시트 자동 생성 Apps Script
 *
 * 사용법:
 * 1. Sheets "Maytutu Finance" 열기 → 확장 프로그램 → Apps Script
 * 2. 본 파일 전체 내용 붙여넣기
 * 3. createAllSheets() 함수 실행 (처음 한 번만)
 *
 * 결과:
 * - 22개 시트 자동 생성
 * - 각 시트에 헤더 row + 시트별 색상 + 고정행 설정
 * - 기존 시트 있으면 스킵 (덮어쓰지 않음)
 *
 * @version 1.0 (2026-04-29)
 */

// ════════════════════════════════════════════════════
// 시트 명세 (DATA_MODEL.md 기반)
// ════════════════════════════════════════════════════
const SHEETS_SPEC = [
  // Group 0 — 시스템
  { name: '사용자', color: '#cfe2ff', headers: ['email', 'name', 'role', 'dept', 'phone', 'active', 'last_login', 'audit_note'] },

  // Group 1 — 마스터
  { name: '법인', color: '#cfe2ff', headers: ['corp_id', 'biz_no', 'name_ko', 'name_en', 'parent_corp_id', 'ceo_name', 'hq_address', 'tax_office', 'bank_main', 'account_main', 'establish_date', 'status', 'audit_note'] },
  { name: '거래처', color: '#cfe2ff', headers: ['partner_id', 'type', 'name', 'biz_no', 'rep_name', 'phone', 'kakao_id', 'email', 'address', 'country', 'bank_name', 'bank_account', 'bank_holder', 'swift_code', 'start_date', 'payment_term', 'default_account_code', 'currency', 'corp_id', 'active', 'audit_note'] },
  { name: '점포', color: '#cfe2ff', headers: ['store_code', 'store_name', 'type', 'owner_partner_id', 'bu_id', 'address', 'sido', 'sigungu', 'zipcode', 'country', 'area_pyeong', 'open_date', 'status', 'avg_monthly_sales_mm_krw', 'pos_provider', 'pos_account_id', 'delivery_baemin_id', 'delivery_yogiyo_id', 'delivery_coupang_id', 'delivery_kakao_id', 'audit_note'] },
  { name: '가맹점계약', color: '#cfe2ff', headers: ['contract_id', 'store_code', 'contract_no', 'signed_date', 'start_date', 'end_date', 'royalty_rate', 'royalty_base', 'franchise_fee', 'deposit', 'monthly_fee', 'training_fee', 'material_mandatory', 'material_supply_rate', 'settlement_day', 'settlement_method', 'vat_treatment', 'auto_renewal', 'renewal_period_yr', 'penalty_clause', 'termination_term', 'status', 'audit_note'] },
  { name: '계정과목', color: '#cfe2ff', headers: ['account_code', 'account_name', 'account_type', 'parent_code', 'corp_id', 'mapping_consolidated', 'tax_treatment', 'active', 'audit_note'] },
  { name: 'BU채널', color: '#cfe2ff', headers: ['bu_id', 'name', 'parent_bu_id', 'corp_id', 'revenue_or_cost', 'active', 'audit_note'] },
  { name: '상품SKU', color: '#cfe2ff', headers: ['sku_code', 'sku_name', 'category', 'unit', 'unit_size', 'barcode', 'reorder_point', 'shelf_life_days', 'active', 'audit_note'] },
  { name: 'BoM', color: '#cfe2ff', headers: ['bom_id', 'sku_code', 'version', 'material_code', 'material_name', 'qty', 'unit', 'active', 'audit_note'] },
  { name: '세율', color: '#cfe2ff', headers: ['rate_id', 'country', 'tax_type', 'rate', 'apply_from', 'apply_to', 'description', 'active', 'audit_note'] },
  { name: '환율', color: '#cfe2ff', headers: ['date', 'currency', 'rate_to_krw', 'source', 'rate_type', 'audit_note'] },

  // Group 2 — 가격·원가
  { name: '원가마스터', color: '#fff3cd', headers: ['cost_id', 'sku_code', 'effective_date', 'direct_material_cost', 'direct_labor_cost', 'manufacturing_overhead', 'packaging_cost', 'logistics_cost', 'total_unit_cost', 'source', 'confidence', 'active', 'audit_note'] },
  { name: '공급가마스터', color: '#fff3cd', headers: ['supply_id', 'sku_code', 'channel', 'effective_date', 'supply_price', 'margin_rate', 'currency', 'min_order_qty', 'active', 'audit_note'] },
  { name: '판매가정책', color: '#fff3cd', headers: ['policy_id', 'sku_code', 'channel', 'effective_date', 'price', 'currency', 'discount_type', 'discount_value', 'start_date', 'end_date', 'active', 'audit_note'] },

  // Group 3 — 트랜잭션
  { name: '거래원장', color: '#d1e7dd', headers: ['txn_id', 'corp_id', 'source', 'source_ref', 'txn_date', 'txn_time', 'partner_id', 'store_code', 'bu_id', 'description', 'amount_gross', 'amount_net', 'vat_amount', 'currency', 'fx_rate', 'amount_krw', 'proposed_account', 'confirmed_account', 'journal_id', 'matched_with', 'status', 'created_by', 'audit_note'] },
  { name: '분개', color: '#d1e7dd', headers: ['journal_id', 'corp_id', 'txn_id', 'journal_date', 'line_no', 'account_code', 'dr_amount', 'cr_amount', 'partner_id', 'bu_id', 'description', 'quarter', 'sealed', 'status', 'created_by', 'audit_note'] },
  { name: '세금계산서_매출', color: '#d1e7dd', headers: ['tax_inv_no', 'popbill_no', 'corp_id', 'issue_date', 'partner_id', 'partner_biz_no', 'partner_name', 'item_name', 'item_qty', 'item_unit', 'unit_price', 'supply_amount', 'vat_amount', 'total_amount', 'tax_type', 'bu_id', 'journal_id', 'popbill_status', 'popbill_response', 'quarter', 'status', 'audit_note'] },
  { name: '세금계산서_매입', color: '#d1e7dd', headers: ['tax_inv_in_id', 'popbill_no', 'corp_id', 'issue_date', 'partner_id', 'partner_biz_no', 'partner_name', 'item_name', 'supply_amount', 'vat_amount', 'total_amount', 'tax_type', 'account_code', 'bu_id', 'journal_id', 'popbill_status', 'quarter', 'status', 'audit_note'] },
  { name: '인보이스', color: '#d1e7dd', headers: ['invoice_no', 'invoice_type', 'corp_id', 'issue_date', 'due_date', 'partner_id', 'store_code', 'period_start', 'period_end', 'items_json', 'subtotal', 'tax_amount', 'total', 'currency', 'fx_rate', 'total_krw', 'pdf_drive_id', 'sent_method', 'sent_at', 'paid_at', 'paid_amount', 'bu_id', 'journal_id', 'status', 'audit_note'] },
  { name: '채권aging', color: '#d1e7dd', headers: ['aging_id', 'invoice_no', 'partner_id', 'invoice_date', 'due_date', 'total', 'paid_amount', 'balance', 'days_overdue', 'aging_bucket', 'last_dunning_date', 'dunning_count', 'currency', 'balance_krw', 'corp_id', 'status', 'audit_note'] },

  // Group 4 — 워크북·감사
  { name: '부가세워크북', color: '#f8d7da', headers: ['workbook_id', 'corp_id', 'quarter', 'period_start', 'period_end', 'sales_total', 'sales_vat', 'purchase_total', 'purchase_vat', 'non_deductible_vat', 'net_vat', 'additional_tax', 'filed_amount', 'filed_date', 'filed_by', 'hometax_receipt', 'drive_pdf_id', 'reconciliation_8_passed', 'sealed_at', 'sealed_by', 'status', 'audit_note'] },
  { name: '감사로그', color: '#f8d7da', headers: ['log_id', 'timestamp', 'user_email', 'action', 'target_sheet', 'target_id', 'before_json', 'after_json', 'reason', 'ip', 'user_agent'] },
];


/**
 * 메인 함수 — 22개 시트 자동 생성
 * Apps Script 편집기에서 실행
 */
function createAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const existing = ss.getSheets().map(s => s.getName());
  let created = 0;
  let skipped = 0;

  SHEETS_SPEC.forEach((spec, idx) => {
    if (existing.includes(spec.name)) {
      Logger.log(`[skip] ${spec.name} - 이미 존재`);
      skipped++;
      return;
    }

    const sheet = ss.insertSheet(spec.name, idx + 1);

    // 헤더 입력
    sheet.getRange(1, 1, 1, spec.headers.length).setValues([spec.headers]);

    // 헤더 스타일링
    const headerRange = sheet.getRange(1, 1, 1, spec.headers.length);
    headerRange.setBackground(spec.color || '#e0e0e0');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');

    // 1행 고정
    sheet.setFrozenRows(1);

    // 컬럼 폭 (자동 + 최소)
    sheet.autoResizeColumns(1, spec.headers.length);

    Logger.log(`[create] ${spec.name} (${spec.headers.length} cols)`);
    created++;
  });

  // 기본 시트(Sheet1) 삭제 (다른 시트 있으면)
  const sheet1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('시트1');
  if (sheet1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(sheet1); } catch (e) { Logger.log('[warn] Sheet1 삭제 실패: ' + e.message); }
  }

  const msg = `✓ 시트 생성 완료\n생성: ${created}개\n스킵: ${skipped}개 (기존)\n총 시트: ${ss.getSheets().length}개`;
  Logger.log(msg);
  SpreadsheetApp.getUi().alert(msg);
}


/**
 * 모든 시트 헤더만 재설정 (구조 변경 시)
 * 데이터는 유지
 */
function resetHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let updated = 0;

  SHEETS_SPEC.forEach(spec => {
    const sheet = ss.getSheetByName(spec.name);
    if (!sheet) return;

    // 헤더만 재설정
    sheet.getRange(1, 1, 1, spec.headers.length).setValues([spec.headers]);
    const headerRange = sheet.getRange(1, 1, 1, spec.headers.length);
    headerRange.setBackground(spec.color || '#e0e0e0');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);

    Logger.log(`[update] ${spec.name} headers reset`);
    updated++;
  });

  SpreadsheetApp.getUi().alert(`✓ 헤더 재설정 완료\n갱신: ${updated}개 시트`);
}


/**
 * 시트 통계 (디버그용)
 */
function showSheetStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let report = '시트 통계\n\n';

  SHEETS_SPEC.forEach(spec => {
    const sheet = ss.getSheetByName(spec.name);
    if (!sheet) {
      report += `❌ ${spec.name} - 없음\n`;
      return;
    }
    const lastRow = Math.max(0, sheet.getLastRow() - 1); // -1 for header
    const lastCol = sheet.getLastColumn();
    const expected = spec.headers.length;
    const status = lastCol === expected ? '✓' : '⚠️';
    report += `${status} ${spec.name}: ${lastRow}행 / ${lastCol}컬럼 (예상 ${expected})\n`;
  });

  Logger.log(report);
  SpreadsheetApp.getUi().alert(report);
}
