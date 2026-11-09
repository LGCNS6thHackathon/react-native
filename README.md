# Inspire Campus · React Native

기존 `frontend`의 수강생 LMS 포털을 Expo / React Native로 구현한 프론트엔드입니다. 백엔드 없이 더미데이터로 실행됩니다.

## 실행

Node.js 22.13 이상을 권장합니다.

```sh
cd react-native
npm install
npm start
```

- iPhone: 같은 네트워크에서 Expo Go로 QR 코드를 스캔합니다. Expo SDK 58을 지원하는 Expo Go가 필요합니다.
- iOS Simulator: `npm run ios` (macOS + Xcode). 실행 후 iPhone 16 시뮬레이터를 선택하세요.
- Android: `npm run android`
- 웹: `npm run web`
- 타입 검사: `npm run typecheck`

## 화면과 동작

- 대시보드: 오늘의 강의, 출석률, 진도, 미제출 과제, 공지, 타임라인
- 교육 일정: 월 이동, 날짜 선택, 출결 상세, 소명 신청 데모, 지난 강의 안내
- 공지사항: 검색, 카테고리 필터, 상세
- Q&A: 검색, 답변 상태 필터, 질문 등록, 답변 상세
- 역량평가: 개인/평균 점수, 영역별 성취도, 멘토 피드백
- 과제실: 상태 필터, 제출 URL 검증, 제출 및 수정
- AI 복습: 입력 노트 기반 로컬 요약 데모, 3문항 퀴즈, 정답 해설
- 마이페이지: 출결/수당/AWS 더미정보, 테마 변경, 데이터 초기화

과제/질문/테마는 AsyncStorage에 저장됩니다. AI 요약, 소명은 로컬 데모이며 실제 AI나 행정 시스템을 호출하지 않습니다. ZEP 강의실 버튼은 `https://zep.us/@lgam06`, 자리이탈감지 버튼은 `https://lms.wsts.kr/detection/student?classId=114`를 기기 브라우저로 엽니다. 강의자료는 기존 frontend의 예시 URL을 사용합니다.

## 반응형

iPhone 16의 393 × 852pt를 기준으로 안전 영역과 하단 홈 인디케이터를 처리합니다. 900pt 미만은 하단 탭과 전체 메뉴, 900pt 이상은 사이드바를 표시합니다. 카드가 화면 폭에 맞춰 재배치되며 상세/작성 모달은 키보드와 스크롤을 지원합니다. 가로 화면, 태블릿, 웹도 지원합니다.

더미데이터는 `frontend/src/lib/lms-data.ts`를 `src/lms-data.ts`에 복사해 네이티브 앱이 독립 실행되도록 구성했습니다. 관리자 웹 포털은 이 수강생 앱의 범위에 포함하지 않습니다.
