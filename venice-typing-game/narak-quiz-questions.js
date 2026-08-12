// =========================================================
// "나락퀴즈" 방에서 사용하는 문제 목록입니다.
// "한국인이라면 모르면 안 되는" 기본 역사/상식 문제 위주로 구성했습니다.
//
// - question : 화면에 보여줄 문제
// - answer   : 참가자가 정확히 입력해야 하는 정답
//   (앞뒤 공백은 자동으로 무시되고, 대소문자는 구분하지 않습니다)
// =========================================================

const NARAK_QUIZ_QUESTIONS = [
  { question: "독도는 어느 나라의 영토인가?", answer: "대한민국" },
  { question: "한글을 창제한 조선의 왕은?", answer: "세종대왕" },
  { question: "3·1 운동이 일어난 연도는? (숫자만)", answer: "1919" },
  { question: "일제강점기가 시작된 연도는? (숫자만)", answer: "1910" },
  { question: "8·15 광복이 이루어진 연도는? (숫자만)", answer: "1945" },
  { question: "6·25 전쟁이 발발한 연도는? (숫자만)", answer: "1950" },
  { question: "대한민국 임시정부가 처음 수립된 도시는?", answer: "상하이" },
  { question: "안중근 의사가 하얼빈에서 저격한 인물은?", answer: "이토히로부미" },
  { question: "3·1 운동 당시 만세운동을 이끈 대표적인 여학생 열사는?", answer: "유관순" },
  { question: "임진왜란 때 거북선을 이끈 장군은?", answer: "이순신" },
  { question: "고려를 세운 인물은?", answer: "왕건" },
  { question: "조선을 세운 인물은?", answer: "이성계" },
  { question: "삼국시대의 세 나라는 고구려, 백제, 그리고?", answer: "신라" },
  { question: "발해를 세운 인물은?", answer: "대조영" },
  { question: "대한민국의 국기 이름은?", answer: "태극기" },
  { question: "대한민국의 국가(國歌) 이름은?", answer: "애국가" },
  { question: "대한민국의 광복절은 몇 월 며칠? (예: 815)", answer: "815" },
  { question: "설날은 음력 몇 월 며칠? (예: 1월1일→11)", answer: "11" },
  { question: "추석은 음력 몇 월 며칠? (예: 8월15일→815)", answer: "815" },
  { question: "1988년 서울에서 개최된 국제 스포츠 대회는?", answer: "서울올림픽" },
  { question: "2002년 한일 월드컵에서 대한민국이 기록한 최종 순위는? (숫자만)", answer: "4" },
  { question: "대한민국 임시정부 초대 대통령은?", answer: "이승만" },
  { question: "우리나라 최초의 한글 소설 '홍길동전'을 지은 인물은?", answer: "허균" },

  { question: "4·19 혁명이 일어난 연도는? (숫자만)", answer: "1960" },
  { question: "IMF 외환위기가 발생한 연도는? (숫자만)", answer: "1997" },
  { question: "2018년 평창에서 열린 국제 겨울 스포츠 대회는?", answer: "평창올림픽" },
  { question: "대한민국 대통령의 임기는 몇 년인가? (숫자만)", answer: "5" },
  { question: "대한민국 국회의원의 임기는 몇 년인가? (숫자만)", answer: "4" },
  { question: "대한민국 헌법상 주권은 누구에게 있는가?", answer: "국민" },
  { question: "태권도가 유래한 나라는?", answer: "대한민국" },
  { question: "대한민국의 전통 가옥을 무엇이라 하는가?", answer: "한옥" },
  { question: "온돌은 전통적으로 무엇을 데우는 난방 방식인가?", answer: "바닥" },
  { question: "김장은 무엇을 담그는 것을 말하는가?", answer: "김치" },
  { question: "대한민국의 국화(나라꽃)는?", answer: "무궁화" },
  { question: "대한민국에서 가장 높은 산은?", answer: "한라산" },
  { question: "대한민국(남한) 내에서 가장 긴 강은?", answer: "낙동강" },
  { question: "대한민국의 최남단 섬은?", answer: "마라도" },
  { question: "대한민국의 수도는?", answer: "서울" },
  { question: "세종대왕이 만든 문자의 이름은?", answer: "한글" },
  { question: "대한민국의 국기는?", answer: "태극기" },
  { question: "대한민국의 국화는?", answer: "무궁화" },
  { question: "대한민국의 화폐 단위는?", answer: "원" },
 
  { question: "우리나라에서 가장 높은 산은?", answer: "한라산" },
  { question: "대한민국의 가장 큰 섬은?", answer: "제주도" },
  { question: "대한민국의 초대 대통령은?", answer: "이승만" },
  { question: "조선 시대의 수도는?", answer: "한양" },
  { question: "대한민국의 수도 서울을 흐르는 대표적인 강은?", answer: "한강" },
];

module.exports = { NARAK_QUIZ_QUESTIONS };
