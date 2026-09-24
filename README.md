# 임장로그 (imjang-log)

내가 임장한 단지를 **대한민국 지도**에 기록하고, 아래 **표**로 날짜·가격·평형·메모를 정리하는 개인용 웹앱입니다.
쌓인 임장 데이터를 바탕으로 다음 보금자리를 고르는 데 씁니다.

- PC / 모바일 반응형 (모바일은 바텀시트 입력 + 플로팅 버튼)
- 애플 스타일 UI, 관심 단지·검색어는 형광펜 하이라이트
- 지도 마커 ↔ 표 행 연동, 거래유형(매매/전세/월세)·지역·관심 필터, 컬럼 정렬
- 위치는 단지명/동 이름 검색(OpenStreetMap) 또는 지도를 탭해서 지정
- 데이터는 브라우저(localStorage)에 저장 · JSON 백업 내보내기/불러오기

## 개발

```bash
npm install
npm run dev
```

## 배포

```bash
npm run deploy   # 빌드 후 gh-pages 브랜치로 푸시 → GitHub Pages
```

## 기술 스택

React 19 · TypeScript · Vite · Leaflet (react-leaflet) · OpenStreetMap
