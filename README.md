# 임장로그 (imjang-log)

내가 임장한 단지를 **대한민국 지도**에 기록하고, 아래 **표**로 날짜·가격·평형·메모를 정리하는 개인용 웹앱입니다.
쌓인 임장 데이터를 바탕으로 다음 보금자리를 고르는 데 씁니다.

- PC / 모바일 반응형 (모바일은 바텀시트 입력 + 플로팅 버튼)
- 지도는 서울 생활권으로 한정
- 애플 스타일 UI, 관심 단지·검색어는 형광펜 하이라이트
- 지도 마커 ↔ 표 행 연동, 거래유형(매매/전세/월세)·지역·관심 필터, 컬럼 정렬
- 위치는 단지명/동 이름 검색(OpenStreetMap) 또는 지도를 탭해서 지정
- 데이터는 이 저장소의 `data/visits.json` 에 저장 → PC·모바일 어디서나 같은 데이터
  - Vercel 함수 `api/visits.ts` 가 서버에서 GitHub API 로 읽기/커밋 (환경변수 `GITHUB_TOKEN`)
  - 기록 추가·수정은 앱 비밀번호(환경변수 `APP_PASSWORD`)를 기기마다 한 번 입력
  - JSON 백업 내보내기/불러오기도 지원

## 개발

```bash
npm install
vercel dev   # API 포함 로컬 실행 (npm run dev 는 화면만)
```

## 배포

- **Vercel**: https://imjang-log-six.vercel.app — GitHub 연동, `main` 에 코드 push 시 자동 배포 (`data/` 만 바뀐 커밋은 빌드 생략)
- GitHub Pages (보조): `npm run deploy`

## 기술 스택

React 19 · TypeScript · Vite · Leaflet (react-leaflet) · OpenStreetMap
