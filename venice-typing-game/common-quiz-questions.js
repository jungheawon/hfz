// =========================================================
// "상식 퀴즈" 방에서 사용하는 문제 목록입니다. (일반 상식)
// 고등학교 정보 교과 문제는 quiz-questions.js 에 따로 있습니다.
//
// 이 파일만 수정하면 문제를 자유롭게 바꿀 수 있습니다.
// - question : 화면에 보여줄 문제
// - answer   : 참가자가 정확히 입력해야 하는 정답
//   (앞뒤 공백은 자동으로 무시되고, 대소문자는 구분하지 않습니다)
// =========================================================

const COMMON_QUIZ_QUESTIONS = [
  { question: "대한민국의 수도는?", answer: "서울" },
  { question: "세계에서 가장 높은 산은?", answer: "에베레스트" },
  { question: "물의 화학 기호는?", answer: "H2O" },
  { question: "1년은 총 몇 일일까요? (평년 기준, 숫자만)", answer: "365" },
  { question: "태양계에서 가장 큰 행성은?", answer: "목성" },
  { question: "피자의 원산지 국가는?", answer: "이탈리아" },
  { question: "인체에서 가장 큰 장기는?", answer: "피부" },
  { question: "세계에서 가장 긴 강은?", answer: "나일강" },
  { question: "축구 한 팀의 필드 플레이어 수(골키퍼 제외, 숫자만)는?", answer: "10" },
  { question: "우리나라 화폐 단위는?", answer: "원" },
  { question: "빛의 삼원색이 아닌 것: 빨강, 초록, 파랑, 노랑 중 정답은?", answer: "노랑" },
  { question: "대한민국의 국화(나라꽃)는?", answer: "무궁화" },
  { question: "지구에서 가장 가까운 별은?", answer: "태양" },
  { question: "커피의 주요 성분 중 각성 효과를 내는 물질은?", answer: "카페인" },
  { question: "대한민국의 표준시는 UTC+몇? (숫자만)", answer: "9" },
  { question: "세계에서 가장 작은 대륙은?", answer: "오세아니아" },
  { question: "무지개의 색깔은 총 몇 가지? (숫자만)", answer: "7" },
  { question: "김치의 주요 재료 중 하나는?", answer: "배추" },
  { question: "물이 어는 온도는 섭씨 몇 도? (숫자만)", answer: "0" },
  { question: "1더하기1은? (숫자만)", answer: "2" },
  { question: "정해원의 뜻은?", answer: "정보해원" },
   { question: "대한민국의 국기는?", answer: "태극기" },
  { question: "지구가 태양을 한 바퀴 도는 데 걸리는 시간은? (일 단위, 숫자만)", answer: "365" },
  { question: "태양계에서 지구와 가장 가까운 행성은?", answer: "금성" },
  { question: "사람의 몸에서 피를 순환시키는 기관은?", answer: "심장" },
  { question: "소리를 듣는 신체 기관은?", answer: "귀" },
  { question: "식물이 광합성을 할 때 흡수하는 기체는?", answer: "이산화탄소" },
  { question: "대한민국의 국가는?", answer: "애국가" },
  { question: "한글을 창제한 왕은?", answer: "세종대왕" },
  { question: "지구의 위성은?", answer: "달" },
  { question: "삼각형의 내각의 합은 몇 도? (숫자만)", answer: "180" },
  { question: "대한민국에서 가장 높은 산은?", answer: "한라산" },
  { question: "세계에서 가장 넓은 대양은?", answer: "태평양" },
  { question: "1킬로미터는 몇 미터인가? (숫자만)", answer: "1000" },
  { question: "컴퓨터의 중앙처리장치를 뜻하는 약자는?", answer: "CPU" },
  { question: "대한민국의 수도 서울을 흐르는 대표적인 강은?", answer: "한강" },
  { question: "지구가 자전하는 데 걸리는 시간은 약 몇 시간인가? (숫자만)", answer: "24" },
  { question: "사계절 중 가장 더운 계절은?", answer: "여름" },
  { question: "태양계에서 태양에 가장 가까운 행성은?", answer: "수성" },
  { question: "대한민국의 국조(나라를 상징하는 새)는?", answer: "까치" },
  { question: "사람의 정상적인 체온은 약 몇 도인가? (숫자만)", answer: "36.5" },
  { question: "대한민국의 국토 면적이 가장 넓은 도는?", answer: "경상북도" },
  { question: "세계에서 면적이 가장 큰 나라는?", answer: "러시아" },
  { question: "태양계에서 고리가 가장 유명한 행성은?", answer: "토성" },
  { question: "공기 중 가장 많은 비율을 차지하는 기체는?", answer: "질소" },
  { question: "사람이 숨을 쉴 때 산소를 받아들이는 기관은?", answer: "폐" },
  { question: "물의 끓는점은 섭씨 몇 도? (숫자만)", answer: "100" },
  { question: "대한민국의 초대 대통령은?", answer: "이승만" },
  { question: "조선 시대의 수도는?", answer: "한양" },
  { question: "3·1 운동이 일어난 해는? (숫자만)", answer: "1919" },
  { question: "대한민국이 광복을 맞은 해는? (숫자만)", answer: "1945" },
  { question: "세계에서 가장 큰 사막은?", answer: "남극 사막" },
  { question: "일본의 수도는?", answer: "도쿄" },
  { question: "중국의 수도는?", answer: "베이징" },
  { question: "미국의 수도는?", answer: "워싱턴 D.C." },
  { question: "컴퓨터에서 데이터를 임시로 저장하는 장치는?", answer: "RAM" },
  { question: "인터넷에서 웹사이트 주소를 나타내는 것은?", answer: "URL" },
  { question: "1바이트는 몇 비트인가? (숫자만)", answer: "8" },
  { question: "빛의 속도는 초당 약 몇 km인가? (숫자만)", answer: "300000" },
  { question: "식물이 햇빛을 이용해 양분을 만드는 과정은?", answer: "광합성" },
  { question: "지구에서 가장 큰 동물은?", answer: "대왕고래" },

];

module.exports = { COMMON_QUIZ_QUESTIONS };
