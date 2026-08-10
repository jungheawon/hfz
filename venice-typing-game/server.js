const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { ANIMALS } = require('./animals');
const { WORDS } = require('./words');
const { JUNGBO_QUIZ_QUESTIONS } = require('./jungbo-quiz-questions');
const { COMMON_QUIZ_QUESTIONS } = require('./common-quiz-questions');
const { HAEWON_QUIZ_QUESTIONS } = require('./haewon-quiz-questions');
const { AI_QUIZ_QUESTIONS } = require('./ai-quiz-questions');
const { DATASCIENCE_QUIZ_QUESTIONS } = require('./datascience-quiz-questions');
const { NARAK_QUIZ_QUESTIONS } = require('./narak-quiz-questions');
const { CHOSUNG_QUIZ_QUESTIONS } = require('./chosung-quiz-questions');
const { WORDS_KR } = require('./words-kr');
const { WORDCHAIN_SEED_WORDS } = require('./wordchain-seed-words');
const { WORDCHAIN_DICTIONARY } = require('./wordchain-dictionary');
const WORDCHAIN_DICT_SET = new Set(WORDCHAIN_DICTIONARY);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// ------------------ 공통 게임 설정값 ------------------
const MAX_PLAYERS = 35;
const START_ROW = 3;           // 시작 위치: 맨 위에서 3칸 아래
const MAX_ROW = 10;            // 물(최하단) 위치
const NEXT_ROUND_DELAY = 1800; // 결과 유지 시간(ms)
const COUNTDOWN_STEP_MS = 700; // 3,2,1 각 숫자 유지 시간

// 라운드별 제한시간(초) - 5초부터 시작해서 점점 줄어듭니다
function getRoundTime(round) {
  if (round <= 10) return 5;
  if (round <= 20) return 4;
  if (round <= 26) return 3;
  if (round <= 31) return 2;
  return 1;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 끝말잇기 단어 검증 (wordchain-dictionary.js 에 있는 단어만 정답으로 인정)
function checkChainWord(chainWord, usedWords, raw) {
  const w = (raw || '').toString().trim();
  if (w.length < 2) return { ok: false, reason: '두 글자 이상 입력해야 해요.' };
  if (!/^[가-힣]+$/.test(w)) return { ok: false, reason: '한글 단어만 입력할 수 있어요.' };
  const lastChar = chainWord[chainWord.length - 1];
  if (w[0] !== lastChar) return { ok: false, reason: `"${lastChar}"(으)로 시작해야 해요.` };
  if (usedWords.has(w)) return { ok: false, reason: '이미 나온 단어예요.' };
  if (!WORDCHAIN_DICT_SET.has(w)) return { ok: false, reason: '사전에 없는 단어예요.' };
  return { ok: true, word: w };
}

// ------------------ 방(room) 하나를 만드는 팩토리 ------------------
// mode: 'typing' (타자연습) | 'quiz' (문제은행 기반 퀴즈)
// questionBank: mode가 'quiz'일 때 사용할 문제 배열 ({question, answer}[])
function createRoom(roomId, mode, label, questionBank, fixedRoundTime) {
  const state = {
    roomId, mode, label,
    players: {},
    hostId: null,
    usedAnimalIds: new Set(),
    eliminationCounter: 0,
    gameState: 'waiting', // waiting | countdown | question | result | ended
    currentRound: 0,
    currentWord: null,     // typing: 정답 단어 / quiz: 정답
    currentQuestionText: null, // quiz: 화면에 보여줄 문제 (typing에서는 currentWord와 동일)
    currentRoundTime: 5,
    fixedRoundTime: fixedRoundTime || null, // 지정하면 라운드가 진행돼도 이 시간으로 고정 (예: 5)
    roundAnswered: {},
    firstCorrectAwarded: false, // 이번 라운드 "1등 정답" 보너스가 이미 지급됐는지
    countdownStep: 3,
    countdownStepStart: 0,
    currentDeadline: 0,
    resultEndTime: 0,
    mainLoopId: null,
    isPaused: false,
    pauseOffset: 0,
    pauseStartTime: null,
    quizOrder: [],   // quiz 모드에서 문제 순서(셔플됨)
    questionBank: questionBank || null,
    quizTotal: mode === 'quiz' && questionBank ? questionBank.length : null,
    wordLanguage: 'en', // typing 모드 전용: 'en' | 'kr' (호스트가 대기실에서 선택)
    chainWord: null,     // wordchain 모드: 지금 이어야 하는 단어
    usedWords: new Set(), // wordchain 모드: 이미 나온 단어들
    roundWinner: null,    // wordchain 모드: 이번 라운드에서 먼저 맞춘 사람 정보
  };

  function vNow() {
    return state.isPaused ? (state.pauseStartTime - state.pauseOffset) : (Date.now() - state.pauseOffset);
  }

  function assignAnimal() {
    const available = ANIMALS.filter(a => !state.usedAnimalIds.has(a.id));
    if (available.length === 0) return null;
    const animal = available[Math.floor(Math.random() * available.length)];
    state.usedAnimalIds.add(animal.id);
    return animal;
  }

  function publicPlayer(p) {
    return {
      id: p.id, nickname: p.nickname, animal: p.animal,
      row: p.row, wrongCount: p.wrongCount, correctCount: p.correctCount, eliminated: p.eliminated,
      isHost: p.id === state.hostId,
    };
  }
  function publicPlayerList() { return Object.values(state.players).map(publicPlayer); }
  function activePlayers() { return Object.values(state.players).filter(p => !p.eliminated); }

  function computeRanking() {
    return Object.values(state.players).map(publicPlayer).sort((a, b) => {
      if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
      if (!a.eliminated) {
        if (a.row !== b.row) return a.row - b.row;
        return a.wrongCount - b.wrongCount;
      }
      return (state.players[b.id].eliminatedAt || 0) - (state.players[a.id].eliminatedAt || 0);
    });
  }

  function emitRoom(event, payload) { io.to(roomId).emit(event, payload); }

  function join(socket, nickname) {
    // 안전장치: 방에 아무도 없는데 상태가 waiting이 아니면(비정상 상황) 자동 복구
    if (state.gameState !== 'waiting' && Object.keys(state.players).length === 0) {
      clearInterval(state.mainLoopId);
      state.mainLoopId = null;
      state.gameState = 'waiting';
      state.isPaused = false; state.pauseOffset = 0; state.pauseStartTime = null;
      state.eliminationCounter = 0;
      state.currentRound = 0;
      state.quizOrder = [];
      state.roundAnswered = {};
      state.firstCorrectAwarded = false;
      state.usedWords = new Set();
      state.chainWord = null;
      state.roundWinner = null;
    }
    if (state.gameState !== 'waiting') {
      socket.emit('errorMsg', { message: '이미 게임이 진행 중입니다. 잠시 후 다시 시도해 주세요.' });
      return;
    }
    if (Object.keys(state.players).length >= MAX_PLAYERS) {
      socket.emit('errorMsg', { message: '대기실 인원이 가득 찼습니다. (최대 35명)' });
      return;
    }
    const clean = (nickname || '').toString().trim().slice(0, 10) || `player${Math.floor(Math.random() * 1000)}`;
    const animal = assignAnimal();
    if (!animal) { socket.emit('errorMsg', { message: '캐릭터를 더 이상 배정할 수 없습니다.' }); return; }
    const isFirst = Object.keys(state.players).length === 0;
    if (isFirst) state.hostId = socket.id;

    socket.join(roomId);
    socket.data.roomId = roomId;

    state.players[socket.id] = {
      id: socket.id, nickname: clean, animal,
      row: START_ROW, wrongCount: 0, correctCount: 0, eliminated: false, eliminatedAt: null,
    };

    socket.emit('joined', {
      self: publicPlayer(state.players[socket.id]),
      isHost: socket.id === state.hostId,
      players: publicPlayerList(),
      roomLabel: state.label,
      quizTotal: state.quizTotal,
      mode: state.mode,
      wordLanguage: state.wordLanguage,
    });
    socket.to(roomId).emit('playerListUpdate', { players: publicPlayerList(), hostId: state.hostId });
  }

  function setWordLanguage(socket, lang) {
    if (socket.id !== state.hostId || state.mode !== 'typing' || state.gameState !== 'waiting') return;
    if (lang !== 'en' && lang !== 'kr') return;
    state.wordLanguage = lang;
    emitRoom('wordLanguageUpdate', { wordLanguage: lang });
  }

  function startGame(socket) {
    if (socket.id !== state.hostId || state.gameState !== 'waiting') return;
    if (Object.keys(state.players).length < 2) {
      socket.emit('errorMsg', { message: '최소 2명 이상 모여야 시작할 수 있습니다.' });
      return;
    }
    state.currentRound = 0;
    state.eliminationCounter = 0;
    Object.values(state.players).forEach(p => { p.row = START_ROW; p.wrongCount = 0; p.correctCount = 0; p.eliminated = false; p.eliminatedAt = null; });
    if (state.mode === 'quiz' && state.questionBank) state.quizOrder = shuffle(state.questionBank.map((_, i) => i));
    if (state.mode === 'wordchain') {
      state.usedWords = new Set();
      state.chainWord = WORDCHAIN_SEED_WORDS[Math.floor(Math.random() * WORDCHAIN_SEED_WORDS.length)];
      state.usedWords.add(state.chainWord);
    }
    emitRoom('gameStarted', { players: publicPlayerList() });
    clearInterval(state.mainLoopId);
    state.mainLoopId = setInterval(tick, 120);
    beginRound();
  }

  function beginRound() {
    const active = activePlayers();
    if (active.length <= 1) { endGame(active[0] || null); return; }
    // 퀴즈 모드는 20문제(또는 준비된 문제 수)를 다 쓰면 그 시점 순위로 종료
    if (state.mode === 'quiz' && state.currentRound >= state.quizTotal) {
      endGame(computeRanking()[0] ? state.players[computeRanking()[0].id] : null);
      return;
    }
    state.currentRound++;
    state.roundAnswered = {};
    state.gameState = 'countdown';
    state.countdownStep = 3;
    state.countdownStepStart = vNow();
    emitRoom('countdownNumber', { n: 3, round: state.currentRound, aliveCount: active.length, quizTotal: state.quizTotal });
  }

  function startQuestionPhase() {
    state.gameState = 'question';
    state.roundWinner = null;
    if (state.mode === 'quiz') {
      const qIdx = state.quizOrder[(state.currentRound - 1) % state.quizOrder.length];
      const q = state.questionBank[qIdx];
      state.currentWord = q.answer;
      state.currentQuestionText = q.question;
    } else if (state.mode === 'wordchain') {
      state.currentWord = null; // 정해진 정답이 없음 (규칙만 맞으면 됨)
      state.currentQuestionText = state.chainWord;
    } else {
      const pool = state.wordLanguage === 'kr' ? WORDS_KR : WORDS;
      state.currentWord = pool[Math.floor(Math.random() * pool.length)];
      state.currentQuestionText = state.currentWord;
    }
    state.currentRoundTime = state.fixedRoundTime || getRoundTime(state.currentRound);
    state.currentDeadline = vNow() + state.currentRoundTime * 1000;
    state.firstCorrectAwarded = false;
    emitRoom('questionStart', {
      round: state.currentRound,
      questionText: state.currentQuestionText,
      chainLastChar: state.mode === 'wordchain' ? state.chainWord[state.chainWord.length - 1] : null,
      timeLimit: state.currentRoundTime,
      aliveCount: activePlayers().length,
      quizTotal: state.quizTotal,
    });
  }

  function applyAnswer(p, correct, extra) {
    let firstBonus = false;
    if (correct) {
      p.correctCount++;
      if (!state.firstCorrectAwarded) {
        state.firstCorrectAwarded = true;
        firstBonus = true;
        p.row = p.row - 1.2; // 1등 정답 보너스: 1.2칸 이동 (천장 제한 없음, 화면 맨 위까지 계속 올라갈 수 있음)
      } else {
        p.row = p.row - 1; // 천장 제한 없음
      }
    } else {
      p.wrongCount++;
      p.row = Math.min(p.row + 1, MAX_ROW);
      if (p.row >= MAX_ROW && !p.eliminated) {
        p.eliminated = true;
        p.eliminatedAt = ++state.eliminationCounter;
      }
    }
    emitRoom('answerResult', Object.assign({
      id: p.id, correct, row: p.row, wrongCount: p.wrongCount, correctCount: p.correctCount, eliminated: p.eliminated, firstBonus,
      correctAnswer: state.mode === 'wordchain' ? null : state.currentWord,
    }, extra || {}));
  }

  function submitAnswer(socket, text) {
    if (state.gameState !== 'question') return;
    const p = state.players[socket.id];
    if (!p || p.eliminated || state.roundAnswered[socket.id]) return;
    state.roundAnswered[socket.id] = true;

    if (state.mode === 'wordchain') {
      const check = checkChainWord(state.chainWord, state.usedWords, text);
      if (check.ok) {
        state.usedWords.add(check.word);
        state.chainWord = check.word;
        state.roundWinner = { id: p.id, nickname: p.nickname, word: check.word };
        applyAnswer(p, true, { chainWord: check.word });
        finishRound(); // 자유경쟁: 누군가 먼저 맞히면 그 즉시 라운드 종료
      } else {
        applyAnswer(p, false, { reason: check.reason });
        maybeFinishEarly();
      }
      return;
    }

    const correct = (text || '').toString().trim().toLowerCase() === (state.currentWord || '').toLowerCase();
    applyAnswer(p, correct);
    maybeFinishEarly();
  }

  function maybeFinishEarly() {
    if (state.gameState !== 'question') return;
    const waiting = activePlayers().filter(p => !state.roundAnswered[p.id]);
    if (waiting.length === 0) finishRound();
  }

  function finishRound() {
    if (state.gameState !== 'question') return;
    state.gameState = 'result';
    activePlayers().forEach(p => {
      if (state.roundAnswered[p.id]) return;
      state.roundAnswered[p.id] = true;
      const extra = state.mode === 'wordchain' && state.roundWinner
        ? { chainWinnerNickname: state.roundWinner.nickname, chainWinnerWord: state.roundWinner.word }
        : undefined;
      applyAnswer(p, false, extra);
    });
    state.resultEndTime = vNow() + NEXT_ROUND_DELAY;
  }

  function endGame(winner) {
    state.gameState = 'ended';
    clearInterval(state.mainLoopId);
    state.isPaused = false; state.pauseOffset = 0; state.pauseStartTime = null;
    emitRoom('gameOver', {
      winner: winner ? { id: winner.id, nickname: winner.nickname, animal: winner.animal } : null,
      ranking: computeRanking(),
    });
  }

  function resetToWaiting() {
    state.gameState = 'waiting';
    clearInterval(state.mainLoopId);
    state.isPaused = false; state.pauseOffset = 0; state.pauseStartTime = null;
    state.eliminationCounter = 0;
    state.currentRound = 0;
    state.usedWords = new Set();
    state.chainWord = null;
    state.roundWinner = null;
    Object.values(state.players).forEach(p => { p.row = START_ROW; p.wrongCount = 0; p.correctCount = 0; p.eliminated = false; p.eliminatedAt = null; });
    emitRoom('gameReset', { players: publicPlayerList(), hostId: state.hostId });
  }

  function pauseGame(socket) {
    if (socket.id !== state.hostId) return;
    if (state.isPaused || state.gameState === 'waiting' || state.gameState === 'ended') return;
    state.isPaused = true;
    state.pauseStartTime = Date.now();
    emitRoom('gamePaused');
  }
  function resumeGame(socket) {
    if (socket.id !== state.hostId || !state.isPaused) return;
    state.pauseOffset += Date.now() - state.pauseStartTime;
    state.isPaused = false;
    const payload = { phase: state.gameState };
    if (state.gameState === 'question') payload.timeRemainingMs = Math.max(0, state.currentDeadline - vNow());
    if (state.gameState === 'countdown') payload.countdownNumber = state.countdownStep;
    emitRoom('gameResumed', payload);
  }
  function restartMidGame(socket) {
    if (socket.id !== state.hostId) return;
    resetToWaiting();
  }
  function restartGame(socket) {
    if (socket.id !== state.hostId || state.gameState !== 'ended') return;
    resetToWaiting();
  }

  function requestRanking(socket) {
    socket.emit('rankingData', { ranking: computeRanking() });
  }

  function chatMessage(socket, text) {
    const p = state.players[socket.id];
    if (!p) return;
    const clean = (text || '').toString().trim().slice(0, 120);
    if (!clean) return;
    emitRoom('chatMessage', { nickname: p.nickname, text: clean, id: socket.id });
  }

  function handleDisconnect(socket) {
    const wasHost = socket.id === state.hostId;
    const existed = state.players[socket.id];
    if (existed) { state.usedAnimalIds.delete(existed.animal.id); delete state.players[socket.id]; }
    delete state.roundAnswered[socket.id];

    if (wasHost) {
      const remaining = Object.keys(state.players);
      state.hostId = remaining.length ? remaining[0] : null;
      if (state.hostId) io.to(state.hostId).emit('youAreHost');
    }

    // 방에 아무도 안 남으면, 게임이 어떤 상태였든 상관없이 완전히 초기화합니다.
    // (호스트가 게임 도중 나가버리고 남은 사람도 없으면 방이 "진행중" 상태로 영영 막혀서
    //  아무도 새로 못 들어오는 문제를 방지)
    if (Object.keys(state.players).length === 0) {
      clearInterval(state.mainLoopId);
      state.mainLoopId = null;
      state.gameState = 'waiting';
      state.isPaused = false; state.pauseOffset = 0; state.pauseStartTime = null;
      state.eliminationCounter = 0;
      state.currentRound = 0;
      state.quizOrder = [];
      state.roundAnswered = {};
      state.firstCorrectAwarded = false;
      state.usedWords = new Set();
      state.chainWord = null;
      state.roundWinner = null;
      return;
    }

    emitRoom('playerListUpdate', { players: publicPlayerList(), hostId: state.hostId });

    if (state.gameState === 'question' || state.gameState === 'countdown') {
      const active = activePlayers();
      if (active.length <= 1) { clearInterval(state.mainLoopId); endGame(active[0] || null); }
      else maybeFinishEarly();
    }
  }

  // 대기실에서 "뒤로가기"로 스스로 나가는 경우 (게임 중엔 사용하지 않음, 대기실 전용)
  function leaveRoom(socket) {
    if (state.gameState !== 'waiting') return;
    const wasHost = socket.id === state.hostId;
    const existed = state.players[socket.id];
    if (existed) { state.usedAnimalIds.delete(existed.animal.id); delete state.players[socket.id]; }

    if (wasHost) {
      const remaining = Object.keys(state.players);
      state.hostId = remaining.length ? remaining[0] : null;
      if (state.hostId) io.to(state.hostId).emit('youAreHost');
    }
    socket.leave(roomId);
    socket.data.roomId = null;
    emitRoom('playerListUpdate', { players: publicPlayerList(), hostId: state.hostId });
  }

  // 게임 중간에 "나가기" 버튼 - 방에서 완전히 나가지는 않고, 그 라운드만 기권(탈락) 처리하고
  // 대기실 화면으로 돌아가게 해줍니다. 다른 사람들의 게임은 계속 진행됩니다.
  function giveUp(socket) {
    const p = state.players[socket.id];
    if (!p || p.eliminated) return;
    if (state.gameState !== 'question' && state.gameState !== 'countdown' && state.gameState !== 'result') return;

    p.eliminated = true;
    p.row = MAX_ROW;
    p.eliminatedAt = ++state.eliminationCounter;
    emitRoom('answerResult', {
      id: p.id, correct: false, row: p.row, wrongCount: p.wrongCount, correctCount: p.correctCount,
      eliminated: true, firstBonus: false, correctAnswer: null, gaveUp: true,
    });

    const active = activePlayers();
    if (active.length <= 1) {
      clearInterval(state.mainLoopId);
      endGame(active[0] || null);
    } else if (state.gameState === 'question') {
      maybeFinishEarly();
    }
  }

  function tick() {
    if (state.isPaused) return;
    if (state.gameState === 'countdown') {
      const elapsed = vNow() - state.countdownStepStart;
      if (elapsed >= COUNTDOWN_STEP_MS) {
        state.countdownStep--;
        if (state.countdownStep >= 1) {
          state.countdownStepStart = vNow();
          emitRoom('countdownNumber', { n: state.countdownStep });
        } else {
          startQuestionPhase();
        }
      }
    } else if (state.gameState === 'question') {
      if (vNow() >= state.currentDeadline) finishRound();
    } else if (state.gameState === 'result') {
      if (vNow() >= state.resultEndTime) {
        const active = activePlayers();
        if (active.length <= 1) endGame(active[0] || null);
        else beginRound();
      }
    }
  }

  return { state, join, startGame, submitAnswer, pauseGame, resumeGame, restartMidGame, restartGame, requestRanking, chatMessage, leaveRoom, giveUp, setWordLanguage, handleDisconnect };
}

const rooms = {
  typing: createRoom('typing', 'typing', '⌨️ 타자연습'),
  common: createRoom('common', 'quiz', '📚 상식 퀴즈', COMMON_QUIZ_QUESTIONS),
  haewon: createRoom('haewon', 'quiz', '🏫 해원고 퀴즈', HAEWON_QUIZ_QUESTIONS),
  quiz: createRoom('quiz', 'quiz', '🧠 정보 퀴즈', JUNGBO_QUIZ_QUESTIONS, 5),
  ai: createRoom('ai', 'quiz', '🤖 인공지능 퀴즈', AI_QUIZ_QUESTIONS, 5),
  datascience: createRoom('datascience', 'quiz', '📊 데이터과학 퀴즈', DATASCIENCE_QUIZ_QUESTIONS, 5),
  wordchain: createRoom('wordchain', 'wordchain', '🔤 끝말잇기'),
  narak: createRoom('narak', 'quiz', '🔥 나락퀴즈', NARAK_QUIZ_QUESTIONS),
  chosung: createRoom('chosung', 'quiz', '🈂️ 초성퀴즈', CHOSUNG_QUIZ_QUESTIONS),
};

function getRoom(roomId) { return rooms[roomId] || rooms.typing; }

io.on('connection', (socket) => {
  socket.on('join', ({ nickname, room }) => {
    getRoom(room).join(socket, nickname);
  });
  socket.on('startGame', () => { if (socket.data.roomId) getRoom(socket.data.roomId).startGame(socket); });
  socket.on('submitAnswer', ({ text }) => { if (socket.data.roomId) getRoom(socket.data.roomId).submitAnswer(socket, text); });
  socket.on('pauseGame', () => { if (socket.data.roomId) getRoom(socket.data.roomId).pauseGame(socket); });
  socket.on('resumeGame', () => { if (socket.data.roomId) getRoom(socket.data.roomId).resumeGame(socket); });
  socket.on('restartMidGame', () => { if (socket.data.roomId) getRoom(socket.data.roomId).restartMidGame(socket); });
  socket.on('restartGame', () => { if (socket.data.roomId) getRoom(socket.data.roomId).restartGame(socket); });
  socket.on('requestRanking', () => { if (socket.data.roomId) getRoom(socket.data.roomId).requestRanking(socket); });
  socket.on('chatMessage', ({ text }) => { if (socket.data.roomId) getRoom(socket.data.roomId).chatMessage(socket, text); });
  socket.on('leaveRoom', () => { if (socket.data.roomId) { getRoom(socket.data.roomId).leaveRoom(socket); socket.data.roomId = null; } });
  socket.on('setWordLanguage', ({ lang }) => { if (socket.data.roomId) getRoom(socket.data.roomId).setWordLanguage(socket, lang); });
  socket.on('giveUp', () => { if (socket.data.roomId) getRoom(socket.data.roomId).giveUp(socket); });
  socket.on('disconnect', () => { if (socket.data.roomId) getRoom(socket.data.roomId).handleDisconnect(socket); });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('==========================================');
  console.log(' 타자 서바이벌 서버 실행 중 (방: 타자연습 / 정보퀴즈)');
  console.log(` 로컬 접속: http://localhost:${PORT}`);
  console.log('==========================================');
});
