# 데스크톱 개발 환경 셋업 — maytutu-finance

> 노트북 → 새 데스크톱·VM에서 본 repo를 이어 작업하기 위한 최소 셋업.

## 사전 요구사항

- git 2.40+
- Python 3.10+ (정적 서빙)
- 브라우저 (Chrome / Firefox / Edge)

빌드 없음 — 단일 파일 PWA(`index.html`).

## 클론·실행

```bash
git clone https://github.com/doganzi/maytutu-finance.git
cd maytutu-finance
./scripts/setup-dev.sh
# → http://localhost:8080
```

## CONFIG (`index.html`)

- `OAUTH_CLIENT_ID`
- `SHEETS_ID` — Maytutu Finance 시트
- `DRIVE_FOLDER_ID` — Invoices PDF 폴더

노트북에서 사용한 ID 그대로 복사.

## Apps Script (백엔드 시드)

운영 중이면 그대로. 신규는:
- `scripts/create_sheets.gs` → `createAllSheets()` (22시트 헤더)
- `scripts/seed_master_data.gs` → `seedAllMasters()` (시드 데이터)

## 외부 시스템 통합

`api.js` — 다른 사내 시스템(ERP·SmartFactory)이 호출하는 모듈. 변경 시 사용처(ERP, SmartFactory) 영향 점검 필수.
