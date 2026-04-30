# Maytutu Finance

사내 회계·세무·자금 통합 시스템.
GitHub Pages + Google Sheets 기반 PWA — 서버·DB 인프라 0원으로 운영.

## 라이브 URL

- **Production**: https://doganzi.github.io/maytutu-finance/ (GitHub Pages 활성 후)
- **Custom domain (옵션)**: https://finance.anghodu.biz/ (Cloudflare CNAME 후)

## 핵심 정체성

- **사용자**: Admin 3명 고정 + 직원 N명 (확장 가능)
- **백엔드**: 없음 — Google Workspace에 클라이언트 OAuth로 직접 통신
- **DB**: Google Sheets (회계 전용 시트, 운영하며 확정)
- **파일**: Google Drive (인보이스 PDF·영수증)
- **인증**: Google OAuth 2.0 + 도메인 제한
- **외부 비용**: 월 약 5천~1만원 (e-Tax SaaS만)
- **빌드 기간**: 약 4~6주

## 빌드 단계 (총 약 4~6주)

| 단계 | 기간 | 범위 |
|---|---|---|
| **STEP 0** | 1주 | 사용자 데이터 수집 + 시트 구조 확정 |
| **MVP-A** | 1주 | OAuth + Sheets layer + 마스터 시트 |
| **MVP-B** | 1~2주 | 거래원장·분개·자금일보·정합성 |
| **V1** | 1~2주 | e-Tax + 물류 자동 + 정산서 |
| **이후** | 필요 시 | 외화·이상거래·결산 자동화 등 |

## 저장소 구성

```
maytutu-finance/
├── index.html              # 단일 파일 PWA (Vanilla JS + HTML + CSS)
├── manifest.json           # PWA 설정
├── api.js                  # ★ 외부 시스템(ERP·SmartFactory) 연결 모듈
├── scripts/                # Apps Script (Sheets 자동 생성·seed)
│   ├── create_sheets.gs    # 22개 시트 헤더 자동 생성
│   └── seed_master_data.gs # 시드 데이터 (법인·세율·BU·계정과목)
└── README.md
```

## 외부 시스템 연결 (ERP/SmartFactory)

ERP·SmartFactory 등 메이투투 그룹의 다른 시스템에서 Finance 데이터에 접근하려면:

```html
<script src="https://doganzi.github.io/maytutu-finance/api.js"></script>
<script>
  // 호출 시스템의 OAuth 토큰
  const partners = await MaytutuFinanceAPI.getPartners(myToken, { type: '가맹점주' });
  const ledger = await MaytutuFinanceAPI.getLedger(myToken, { corp_id: 'MAYTUTU', dateFrom: '2026-01-01' });

  // 외부 시스템에서 거래 push
  await MaytutuFinanceAPI.appendLedger(myToken, {
    source: 'erp_purchase',
    source_ref: 'PO-2026-001',
    txn_date: '2026-04-30',
    amount_gross: 1500000,
    currency: 'KRW',
    _caller_system: 'maytutu-erp',
  });
</script>
```

상세 통합 가이드는 사내 `docs/INTEGRATION.md`. (이 public repo에는 미포함)

> 운영 docs·내부 워크북·환경 셋업 가이드 등은 사내 보관 (이 public repo에는 미포함).

## 시작하기

### 1. 사내 환경 셋업 (Admin 작업)
1. Google Sheets "Maytutu Finance" 신규 생성 → Sheets ID 메모
2. Google Drive 폴더 "Maytutu Finance" + "Invoices PDF" → ID 메모
3. OAuth 클라이언트 등록 (Workspace 도메인 제한)
4. ID들을 `index.html` 의 `CONFIG` 객체에 등록 (private fork 또는 별도 secrets)

### 2. Apps Script 실행
1. Sheets → 확장 프로그램 → Apps Script
2. `scripts/create_sheets.gs` 붙여넣기 → `createAllSheets()` 실행 → 22시트 헤더 자동 생성
3. `scripts/seed_master_data.gs` 붙여넣기 → `seedAllMasters()` 실행 → 기본 시드 데이터

### 3. GitHub Pages 활성화
1. Settings → Pages → Source: **Deploy from a branch** → main / (root)
2. (옵션) Custom domain: finance.anghodu.biz

## 보안

- **Implicit OAuth Flow** — Client Secret 미사용. ID 노출 시에도 토큰 없이는 접근 불가.
- **도메인 제한** — Workspace 도메인의 계정만 로그인 가능. 외부 차단.
- **Sheets 권한** — Workspace 공유 권한이 곧 앱 접근 권한.
- **Audit log 시트** — 모든 데이터 변경 영구 기록.
- **분기 봉인** — 부가세 신고 후 해당 분기 변경 차단.

## 기술 스택

| 영역 | 구성 |
|---|---|
| 프론트엔드 | Vanilla JS + HTML + CSS, 단일 `index.html` |
| PWA | manifest.json + 홈화면 추가 + standalone |
| 인증 | Google OAuth 2.0 (사용자 본인 계정) |
| 데이터 | Google Sheets API (직접 호출) |
| 파일 | Google Drive API |
| 빌드 | 없음 — 단일 파일 정적 배포 |
| CI/CD | GitHub Pages 자동 배포 (main 브랜치) |

## 개발

```bash
# 로컬 미리보기 (정적)
python -m http.server 8080
# → http://localhost:8080
```

배포는 main 브랜치 push만 하면 자동 (1~2분).

## 라이선스

사내 사용 전용. 외부 배포·재사용 금지.
