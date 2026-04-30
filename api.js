/**
 * Maytutu Finance — Public API for inter-system integration
 *
 * 사용 시스템:
 *   - doganzi/maytutu-erp        (전사 ERP)
 *   - doganzi/maytutu-smartfactory (생산)
 *   - 향후 추가 시스템
 *
 * 사용법:
 *   <script src="https://doganzi.github.io/maytutu-finance/api.js"></script>
 *   <script>
 *     // anghodu.biz Workspace OAuth 토큰 (호출 시스템 본인의 토큰)
 *     const partners = await MaytutuFinanceAPI.getPartners(myToken);
 *   </script>
 *
 * 인증:
 *   - 같은 anghodu.biz Workspace 내 OAuth 클라이언트 사용
 *   - CLIENT_ID는 시스템마다 별도여도 OK (Sheets API scope만 동일)
 *   - 토큰은 호출자가 발급·갱신·관리 (Maytutu Finance가 토큰 발급 안 함)
 *
 * 시트 마스터 정책 (Single Source of Truth):
 *   - Maytutu Finance 가 마스터인 시트:
 *     • 법인, 거래처, 점포, 가맹점계약, 계정과목, BU채널, 세율, 환율
 *     • 거래원장, 분개, 세금계산서_매출/매입, 인보이스, 채권aging, 부가세워크북, 감사로그
 *   - 다른 시스템이 마스터 (Finance가 read-only):
 *     • 상품SKU, BoM (SmartFactory 또는 ERP가 마스터)
 *     • 원가/공급가/판매가 (Finance·ERP 협의)
 *
 * @version 0.1.0 (2026-04-30)
 */

(function (global) {
  'use strict';

  // ════════════════════════════════════════════════════
  // 시스템 식별 정보 (외부 시스템이 참조)
  // ════════════════════════════════════════════════════
  const FINANCE_CONFIG = {
    SYSTEM_NAME: 'Maytutu Finance',
    VERSION: '0.1.0-MVP-A',
    SHEET_ID: '1oNaPr5UPG4GgRQE6pE47YDXHlxp4juVFsxMet3azG04',
    DRIVE_FOLDER_ID: '10zvNMtkULd8EmUv-odRQCz4yLnDapJ2F',
    PDF_FOLDER_ID: '1cmkosGyLAvYEoBoCX7btEX1v7jTWIehr',

    // 외부 시스템이 OAuth 클라이언트 등록 시 추가해야 할 scope
    REQUIRED_SCOPES: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],

    // 마스터 소유 정책 (외부 시스템이 read 우선)
    MASTER_OWNERSHIP: {
      '법인': 'finance',
      '거래처': 'finance',
      '점포': 'finance',
      '가맹점계약': 'finance',
      '계정과목': 'finance',
      'BU채널': 'finance',
      '세율': 'finance',
      '환율': 'finance',
      '상품SKU': 'shared',  // SmartFactory + Finance 공동
      'BoM': 'smartfactory',
      '원가마스터': 'shared',
      '공급가마스터': 'shared',
      '판매가정책': 'finance',
      '거래원장': 'finance',
      '분개': 'finance',
      '세금계산서_매출': 'finance',
      '세금계산서_매입': 'finance',
      '인보이스': 'finance',
      '채권aging': 'finance',
      '부가세워크북': 'finance',
      '감사로그': 'finance',
      '사용자': 'finance',
    },
  };

  // ════════════════════════════════════════════════════
  // 내부 helpers
  // ════════════════════════════════════════════════════
  const SHEETS_API_BASE = `https://sheets.googleapis.com/v4/spreadsheets/${FINANCE_CONFIG.SHEET_ID}`;

  async function _fetch(url, opts, token) {
    const res = await fetch(url, {
      ...opts,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(opts?.headers || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`MaytutuFinanceAPI: ${res.status} ${res.statusText} on ${url}`);
    }
    return res.json();
  }

  async function _getAll(tab, token) {
    const data = await _fetch(`${SHEETS_API_BASE}/values/${encodeURIComponent(tab)}`, {}, token);
    if (!data.values || data.values.length < 2) return { headers: data.values?.[0] || [], rows: [] };
    return {
      headers: data.values[0],
      rows: data.values.slice(1),
    };
  }

  function _toObjects(headers, rows) {
    return rows.map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i]; });
      return obj;
    });
  }

  async function _append(tab, rows, token) {
    const body = { values: Array.isArray(rows[0]) ? rows : [rows] };
    const colCount = Array.isArray(rows[0]) ? rows[0].length : rows.length;
    const endCol = String.fromCharCode(64 + Math.min(colCount, 26));
    const range = `${tab}!A:${endCol}`;
    return _fetch(
      `${SHEETS_API_BASE}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      { method: 'POST', body: JSON.stringify(body) },
      token
    );
  }

  // ════════════════════════════════════════════════════
  // 공개 API
  // ════════════════════════════════════════════════════
  const MaytutuFinanceAPI = {
    CONFIG: FINANCE_CONFIG,

    // ─── 마스터 read (Finance가 master인 시트) ───
    async getLegalEntities(token) {
      const { headers, rows } = await _getAll('법인', token);
      return _toObjects(headers, rows);
    },

    async getPartners(token, opts = {}) {
      const { headers, rows } = await _getAll('거래처', token);
      let result = _toObjects(headers, rows);
      if (opts.type) result = result.filter(p => p.type === opts.type);
      if (opts.country) result = result.filter(p => p.country === opts.country);
      if (opts.active !== undefined) result = result.filter(p => String(p.active) === String(opts.active));
      return result;
    },

    async getStores(token, opts = {}) {
      const { headers, rows } = await _getAll('점포', token);
      let result = _toObjects(headers, rows);
      if (opts.type) result = result.filter(s => s.type === opts.type);
      if (opts.bu_id) result = result.filter(s => s.bu_id === opts.bu_id);
      if (opts.country) result = result.filter(s => s.country === opts.country);
      return result;
    },

    async getFranchiseContracts(token, opts = {}) {
      const { headers, rows } = await _getAll('가맹점계약', token);
      let result = _toObjects(headers, rows);
      if (opts.store_code) result = result.filter(c => c.store_code === opts.store_code);
      if (opts.status) result = result.filter(c => c.status === opts.status);
      return result;
    },

    async getAccounts(token, opts = {}) {
      const { headers, rows } = await _getAll('계정과목', token);
      let result = _toObjects(headers, rows);
      if (opts.corp_id) result = result.filter(a => a.corp_id === opts.corp_id || !a.corp_id);
      if (opts.account_type) result = result.filter(a => a.account_type === opts.account_type);
      return result;
    },

    async getBUs(token, opts = {}) {
      const { headers, rows } = await _getAll('BU채널', token);
      let result = _toObjects(headers, rows);
      if (opts.corp_id) result = result.filter(b => b.corp_id === opts.corp_id);
      return result;
    },

    async getTaxRates(token, opts = {}) {
      const { headers, rows } = await _getAll('세율', token);
      let result = _toObjects(headers, rows);
      if (opts.country) result = result.filter(t => t.country === opts.country);
      if (opts.tax_type) result = result.filter(t => t.tax_type === opts.tax_type);
      if (opts.active !== undefined) result = result.filter(t => String(t.active) === String(opts.active));
      return result;
    },

    async getFxRates(token, opts = {}) {
      const { headers, rows } = await _getAll('환율', token);
      let result = _toObjects(headers, rows);
      if (opts.currency) result = result.filter(f => f.currency === opts.currency);
      if (opts.dateFrom) result = result.filter(f => f.date >= opts.dateFrom);
      return result;
    },

    // ─── 트랜잭션 read ───
    async getLedger(token, opts = {}) {
      const { headers, rows } = await _getAll('거래원장', token);
      let result = _toObjects(headers, rows);
      if (opts.corp_id) result = result.filter(t => t.corp_id === opts.corp_id);
      if (opts.dateFrom) result = result.filter(t => t.txn_date >= opts.dateFrom);
      if (opts.dateTo) result = result.filter(t => t.txn_date <= opts.dateTo);
      if (opts.source) result = result.filter(t => t.source === opts.source);
      if (opts.partner_id) result = result.filter(t => t.partner_id === opts.partner_id);
      if (opts.store_code) result = result.filter(t => t.store_code === opts.store_code);
      return result;
    },

    async getJournals(token, opts = {}) {
      const { headers, rows } = await _getAll('분개', token);
      let result = _toObjects(headers, rows);
      if (opts.corp_id) result = result.filter(j => j.corp_id === opts.corp_id);
      if (opts.dateFrom) result = result.filter(j => j.journal_date >= opts.dateFrom);
      if (opts.dateTo) result = result.filter(j => j.journal_date <= opts.dateTo);
      if (opts.quarter) result = result.filter(j => j.quarter === opts.quarter);
      if (opts.account_code) result = result.filter(j => j.account_code === opts.account_code);
      return result;
    },

    async getTaxInvoicesOut(token, opts = {}) {
      const { headers, rows } = await _getAll('세금계산서_매출', token);
      let result = _toObjects(headers, rows);
      if (opts.corp_id) result = result.filter(t => t.corp_id === opts.corp_id);
      if (opts.dateFrom) result = result.filter(t => t.issue_date >= opts.dateFrom);
      if (opts.partner_id) result = result.filter(t => t.partner_id === opts.partner_id);
      if (opts.quarter) result = result.filter(t => t.quarter === opts.quarter);
      return result;
    },

    async getTaxInvoicesIn(token, opts = {}) {
      const { headers, rows } = await _getAll('세금계산서_매입', token);
      let result = _toObjects(headers, rows);
      if (opts.corp_id) result = result.filter(t => t.corp_id === opts.corp_id);
      if (opts.dateFrom) result = result.filter(t => t.issue_date >= opts.dateFrom);
      if (opts.quarter) result = result.filter(t => t.quarter === opts.quarter);
      return result;
    },

    async getInvoices(token, opts = {}) {
      const { headers, rows } = await _getAll('인보이스', token);
      let result = _toObjects(headers, rows);
      if (opts.corp_id) result = result.filter(i => i.corp_id === opts.corp_id);
      if (opts.invoice_type) result = result.filter(i => i.invoice_type === opts.invoice_type);
      if (opts.partner_id) result = result.filter(i => i.partner_id === opts.partner_id);
      if (opts.store_code) result = result.filter(i => i.store_code === opts.store_code);
      if (opts.status) result = result.filter(i => i.status === opts.status);
      return result;
    },

    async getReceivables(token, opts = {}) {
      const { headers, rows } = await _getAll('채권aging', token);
      let result = _toObjects(headers, rows);
      if (opts.corp_id) result = result.filter(r => r.corp_id === opts.corp_id);
      if (opts.partner_id) result = result.filter(r => r.partner_id === opts.partner_id);
      if (opts.aging_bucket) result = result.filter(r => r.aging_bucket === opts.aging_bucket);
      return result;
    },

    // ─── 트랜잭션 write (외부 시스템이 거래 push) ───
    /**
     * ERP·SmartFactory가 발생시킨 거래를 Finance 거래원장에 적재
     * @param {string} token - 호출자 OAuth token
     * @param {object} txn - 거래원장 row (object 또는 array)
     * @returns {Promise} append 결과
     *
     * 필수 필드:
     *   - source: 'erp_xxx' | 'smartfactory_xxx' | 호출 시스템 명
     *   - source_ref: 외부 시스템에서의 unique ID (역추적용)
     *   - txn_date, amount_gross, currency, description
     *
     * Finance가 자동 처리:
     *   - txn_id 채번 (TXN-{corp}-{YYMMDD}-{NNNNN})
     *   - status='raw' (분개는 Finance에서 별도)
     */
    async appendLedger(token, txn) {
      const headers = (await _getAll('거래원장', token)).headers;
      const row = headers.map(h => txn[h] ?? '');
      // status 미지정 시 'raw'
      const statusIdx = headers.indexOf('status');
      if (statusIdx >= 0 && !row[statusIdx]) row[statusIdx] = 'raw';
      // created_by 미지정 시 caller 정보 (가능하면)
      const cbIdx = headers.indexOf('created_by');
      if (cbIdx >= 0 && !row[cbIdx]) row[cbIdx] = txn._caller_system || 'external';
      return _append('거래원장', [row], token);
    },

    /**
     * 외부 시스템이 발행한 인보이스를 Finance 인보이스 시트에 적재
     */
    async appendInvoice(token, invoice) {
      const headers = (await _getAll('인보이스', token)).headers;
      const row = headers.map(h => invoice[h] ?? '');
      return _append('인보이스', [row], token);
    },

    // ─── 메타 정보 ───
    /**
     * 시스템 health check (외부 시스템에서 연결 가능 여부 확인)
     */
    async ping(token) {
      try {
        await _fetch(`${SHEETS_API_BASE}?fields=spreadsheetId`, {}, token);
        return { ok: true, system: FINANCE_CONFIG.SYSTEM_NAME, version: FINANCE_CONFIG.VERSION };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    },

    /**
     * 마스터 시트 헤더 조회 (외부 시스템이 스키마 검증용)
     */
    async getSchema(token, sheetName) {
      const data = await _fetch(`${SHEETS_API_BASE}/values/${encodeURIComponent(sheetName)}!1:1`, {}, token);
      return data.values?.[0] || [];
    },
  };

  // ════════════════════════════════════════════════════
  // Export
  // ════════════════════════════════════════════════════
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MaytutuFinanceAPI;
  } else {
    global.MaytutuFinanceAPI = MaytutuFinanceAPI;
  }

})(typeof window !== 'undefined' ? window : globalThis);
