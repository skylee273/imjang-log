# 임장로그 (imjang-log)

내가 임장한 단지를 **대한민국 지도**에 기록하고, 아래 **표**로 날짜·가격·평형·메모를 정리하는 개인용 웹앱입니다.
쌓인 임장 데이터를 바탕으로 다음 보금자리를 고르는 데 씁니다.

- PC / 모바일 반응형 (모바일은 바텀시트 입력 + 플로팅 버튼)
- 애플 스타일 UI, 관심 단지·검색어는 형광펜 하이라이트
- 지도 마커 ↔ 표 행 연동, 거래유형(매매/전세/월세)·지역·관심 필터, 컬럼 정렬
- 위치는 단지명/동 이름 검색(OpenStreetMap) 또는 지도를 탭해서 지정
- 데이터는 이 저장소의 `data/visits.json` 에 저장 → PC·모바일 어디서나 같은 데이터
  - 누구나 읽기 가능, 추가·수정은 GitHub 토큰(Contents: Read and write)을 앱의 “GitHub 연결”에 한 번 입력한 기기에서
  - 저장할 때마다 자동으로 커밋되고, 오프라인/토큰 없을 땐 브라우저에 임시 저장 후 나중에 올림
  - JSON 백업 내보내기/불러오기도 지원

## 개발

```bash
npm install
npm run dev
```

## 배포

- **Vercel**: https://imjang-log-six.vercel.app — `main` 에 코드 push 시 자동 배포 (`data/` 만 바뀐 커밋은 빌드 생략)
- GitHub Pages (보조): `npm run deploy`

## 기술 스택

React 19 · TypeScript · Vite · Leaflet (react-leaflet) · OpenStreetMap
