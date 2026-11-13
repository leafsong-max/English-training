import {
  ConversationScenario,
  DailySentence,
  GrammarLesson,
  PlantStage,
  QuizQuestion,
  StudyMode,
  WeekdayKey,
  WritingPrompt,
} from "../types.ts";

export interface WeekdayScheduleItem {
  key: WeekdayKey;
  shortLabel: string;
  fullLabel: string;
  mode: StudyMode;
  modeLabel: string;
  jsDay: number; // 0 = Sun, 1 = Mon ... 6 = Sat
}

export const WEEKDAY_SCHEDULE: WeekdayScheduleItem[] = [
  { key: "mon", shortLabel: "월", fullLabel: "월요일", mode: "grammar", modeLabel: "영어 문법", jsDay: 1 },
  { key: "tue", shortLabel: "화", fullLabel: "화요일", mode: "writing", modeLabel: "영어 영작", jsDay: 2 },
  { key: "wed", shortLabel: "수", fullLabel: "수요일", mode: "grammar", modeLabel: "영어 문법", jsDay: 3 },
  { key: "thu", shortLabel: "목", fullLabel: "목요일", mode: "writing", modeLabel: "영어 영작", jsDay: 4 },
  { key: "fri", shortLabel: "금", fullLabel: "금요일", mode: "conversation", modeLabel: "영어 회화", jsDay: 5 },
  { key: "sat", shortLabel: "토", fullLabel: "토요일", mode: "conversation", modeLabel: "영어 회화", jsDay: 6 },
  { key: "sun", shortLabel: "일", fullLabel: "일요일", mode: "conversation", modeLabel: "영어 회화", jsDay: 0 },
];

export const STUDY_TRACKS: Array<{
  mode: StudyMode;
  titleKo: string;
  daysLabel: string;
  descriptionKo: string;
}> = [
  {
    mode: "grammar",
    titleKo: "영어 문법",
    daysLabel: "월 · 수",
    descriptionKo: "헷갈리기 쉬운 시제, 조동사, 전치사 구조를 짧은 예문과 작문 드릴로 다집니다.",
  },
  {
    mode: "writing",
    titleKo: "영어 영작",
    daysLabel: "화 · 목",
    descriptionKo: "한국어 의도를 영어로 옮기면 AI가 문법 오류를 짚고 원어민 표현을 제안합니다.",
  },
  {
    mode: "conversation",
    titleKo: "영어 회화",
    daysLabel: "금 · 토 · 일",
    descriptionKo: "실전 상황 롤플레이를 주고받으며 즉각적인 스피킹·자연스러움 코칭을 받습니다.",
  },
];

export function getTodayWeekdayItem(): WeekdayScheduleItem {
  const jsDay = new Date().getDay();
  return WEEKDAY_SCHEDULE.find((d) => d.jsDay === jsDay) ?? WEEKDAY_SCHEDULE[0];
}

export const PLANT_STAGES: PlantStage[] = [
  {
    level: 1,
    nameKo: "잠든 씨앗",
    englishName: "Dormant Seed",
    minXp: 0,
    maxXp: 100,
    messageKo: "첫 문장을 기록하고 퀴즈를 풀면 흙 속에서 싹이 트기 시작합니다.",
  },
  {
    level: 2,
    nameKo: "여린 새싹",
    englishName: "Tender Sprout",
    minXp: 100,
    maxXp: 250,
    messageKo: "초록빛 떡잎이 돋아났어요. 매일 10분 꾸준함이 가장 좋은 양분입니다.",
  },
  {
    level: 3,
    nameKo: "푸른 어린 줄기",
    englishName: "Young Stem",
    minXp: 250,
    maxXp: 500,
    messageKo: "문법의 뿌리가 단단해지면서 줄기가 힘차게 위로 자라고 있습니다.",
  },
  {
    level: 4,
    nameKo: "무성한 잎사귀",
    englishName: "Leafy Foliage",
    minXp: 500,
    maxXp: 900,
    messageKo: "어휘와 자연스러운 표현의 잎이 풍성하게 펼쳐지고 있어요.",
  },
  {
    level: 5,
    nameKo: "피어나는 꽃봉오리",
    englishName: "Budding Blossom",
    minXp: 900,
    maxXp: 1400,
    messageKo: "오답 복습까지 놓치지 않은 덕분에 곧 화사한 꽃이 피어납니다.",
  },
  {
    level: 6,
    nameKo: "만개한 지식의 나무",
    englishName: "Flourishing Bloom",
    minXp: 1400,
    maxXp: 2000,
    messageKo: "문법·영작·회화가 조화롭게 꽃피운 영어 정원이 완성되었습니다.",
  },
];

export function getPlantStage(xp: number): {
  current: PlantStage;
  next: PlantStage | null;
  progressPercent: number;
  xpIntoStage: number;
  xpNeededForNext: number;
} {
  let idx = 0;
  for (let i = 0; i < PLANT_STAGES.length; i++) {
    if (xp >= PLANT_STAGES[i].minXp) {
      idx = i;
    }
  }
  const current = PLANT_STAGES[idx];
  const next = idx < PLANT_STAGES.length - 1 ? PLANT_STAGES[idx + 1] : null;
  if (!next) {
    return {
      current,
      next: null,
      progressPercent: 100,
      xpIntoStage: xp - current.minXp,
      xpNeededForNext: 0,
    };
  }
  const span = next.minXp - current.minXp;
  const into = Math.max(0, xp - current.minXp);
  return {
    current,
    next,
    progressPercent: Math.min(100, Math.round((into / span) * 100)),
    xpIntoStage: into,
    xpNeededForNext: Math.max(0, next.minXp - xp),
  };
}

export const GRAMMAR_LESSONS: GrammarLesson[] = [
  {
    id: "gram-1",
    titleKo: "감정 분사: excited vs. exciting",
    subtitleKo: "한국인이 가장 자주 틀리는 -ed / -ing 형용사 구분",
    ruleSummaryKo: "사람이 감정을 '느낄' 때는 과거분사(-ed), 사물이나 상황이 감정을 '유발할' 때는 현재분사(-ing)를 씁니다.",
    incorrectExample: "I am so exciting about the trip tomorrow.",
    correctExample: "I am so excited about the trip tomorrow.",
    tipKo: "주어가 '나(I)'이고 설렘을 느낀 주체라면 excited, '여행(the trip)'이 신나는 대상이면 exciting입니다.",
    drillPromptKo: "'그 영화는 정말 흥미진진했다' 또는 '나는 새 프로젝트가 기대된다'를 영어로 써보세요.",
    sampleAnswerEn: "I'm really excited about starting this new project.",
  },
  {
    id: "gram-2",
    titleKo: "현재완료 vs. 과거시제 (have p.p. vs. V-ed)",
    subtitleKo: "명확한 과거 시점 부사가 있을 때의 시제 선택",
    ruleSummaryKo: "yesterday, last week, in 2022처럼 끝난 과거 시점이 명시되면 현재완료(have p.p.) 대신 단순과거를 씁니다.",
    incorrectExample: "I have met her at the cafe yesterday.",
    correctExample: "I met her at the cafe yesterday.",
    tipKo: "과거부터 지금까지 이어진 경험이나 상태를 말할 때만 'I have met her before'처럼 현재완료를 사용하세요.",
    drillPromptKo: "'어제 저녁에 친구와 영어로 대화했다'를 시제에 맞게 영작해 보세요.",
    sampleAnswerEn: "I practiced speaking English with my friend last night.",
  },
  {
    id: "gram-3",
    titleKo: "요청·사과 뒤 전치사 함정 (discuss, mention, explain)",
    subtitleKo: "타동사 뒤에 전치사를 붙이지 않는 핵심 패턴",
    ruleSummaryKo: "discuss, mention, enter, reach는 그 자체로 목적어를 바로 받는 타동사입니다. explain은 'explain A to B' 구조를 씁니다.",
    incorrectExample: "Let's discuss about the schedule and explain me the plan.",
    correctExample: "Let's discuss the schedule and explain the plan to me.",
    tipKo: "discuss about(X) → discuss + 명사(O), explain me(X) → explain + 내용 + to me(O)로 기억하세요.",
    drillPromptKo: "'회의에서 새로운 아이디어를 논의합시다'를 영어로 작성해 보세요.",
    sampleAnswerEn: "Let's discuss the new ideas during the meeting.",
  },
  {
    id: "gram-4",
    titleKo: "가정법 과거: If I were / I wish I could",
    subtitleKo: "현재 사실과 반대되는 부드러운 바람과 가정",
    ruleSummaryKo: "현재 일어날 가능성이 적거나 반대되는 상상을 말할 때는 If + 주어 + 과거동사, 주어 + would/could + 동사원형을 씁니다.",
    incorrectExample: "If I have more time, I will travel around Europe.",
    correctExample: "If I had more time, I would travel around Europe.",
    tipKo: "현실적인 조건이면 If I have ~ will, 지금 시간이 부족해 아쉬운 가정이면 If I had ~ would가 자연스럽습니다.",
    drillPromptKo: "'내가 영어를 더 유창하게 말할 수 있다면 좋겠다'를 영어로 써보세요.",
    sampleAnswerEn: "I wish I could speak English more fluently.",
  },
];

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: "write-1",
    titleKo: "일상 루틴과 다짐 쓰기",
    koreanPrompt: "요즘 출근하기 전에 20분씩 영어 기사를 읽으려고 노력하고 있어. 처음엔 어려웠는데 이제는 점점 익숙해지고 있어.",
    levelLabel: "중급 · 일상",
    hintWords: ["try to", "before heading to work", "get used to"],
    modelAnswerEn: "Lately, I've been trying to read an English article for 20 minutes before heading to work. It felt tough at first, but I'm slowly getting used to it.",
  },
  {
    id: "write-2",
    titleKo: "업무 일정 정중히 조율하기",
    koreanPrompt: "죄송하지만 목요일 오후 회의 시간을 금요일 오전으로 옮길 수 있을까요? 갑작스러운 일정이 생겼습니다.",
    levelLabel: "실무 · 이메일",
    hintWords: ["reschedule", "something urgent came up", "work for you"],
    modelAnswerEn: "I'm sorry for the short notice, but would it be possible to move Thursday afternoon's meeting to Friday morning? Something urgent just came up.",
  },
  {
    id: "write-3",
    titleKo: "주말 계획과 기대감 표현",
    koreanPrompt: "이번 주말에는 오랜만에 한강 근처 카페에서 책을 읽으면서 여유롭게 시간을 보낼 계획이야.",
    levelLabel: "초중급 · 회화체",
    hintWords: ["unwind", "in a while", "grab a coffee"],
    modelAnswerEn: "This weekend, I'm planning to unwind at a cozy cafe near the Han River with a good book—it's been a while since I had some quiet time.",
  },
  {
    id: "write-4",
    titleKo: "의견 부드럽게 전달하기",
    koreanPrompt: "제 생각에는 두 번째 제안이 비용 면에서 더 효율적인 것 같아요. 하지만 팀원들의 의견도 들어보고 싶습니다.",
    levelLabel: "중고급 · 의견",
    hintWords: ["cost-effective", "from my perspective", "open to hearing"],
    modelAnswerEn: "From my perspective, the second option seems more cost-effective, though I'd love to hear everyone else's thoughts as well.",
  },
];

export const CONVERSATION_SCENARIOS: ConversationScenario[] = [
  {
    id: "conv-1",
    titleKo: "동네 카페에서 주문 & 스몰토크",
    subtitleKo: "주말 아침 바리스타와 자연스럽게 대화하기",
    contextEn: "You are ordering coffee at a cozy neighborhood cafe on a sunny weekend morning. The barista is friendly and asks about your weekend plans.",
    openingEn: "Good morning! Welcome in. What can I get started for you today? Doing anything fun this weekend?",
    openingKo: "좋은 아침이에요! 어서 오세요. 오늘 어떤 음료로 준비해 드릴까요? 주말에 특별한 계획 있으신가요?",
    keyExpressions: [
      { en: "Could I get an iced oat latte, please?", ko: "아이스 오트 라떼 한 잔 주시겠어요?" },
      { en: "Nothing too crazy, just catching up on some reading.", ko: "별건 없고 밀린 독서나 좀 하려고요." },
      { en: "I'll have it for here, thanks.", ko: "매장에서 먹고 갈게요, 감사합니다." },
    ],
    starterReplies: [
      "Hi! Could I get an iced Americano for here, please? I'm just planning to relax and read a book.",
      "Good morning! What do you recommend today? I want something refreshing.",
    ],
  },
  {
    id: "conv-2",
    titleKo: "글로벌 팀 데일리 스탠드업",
    subtitleKo: "진행 상황 공유 및 도움 요청하기",
    contextEn: "You are in a quick morning standup call with your teammate Alex. Share what you finished yesterday and mention a slight delay politely.",
    openingEn: "Hey! Thanks for hopping on. How's the UI update coming along? Are we still on track for Friday?",
    openingKo: "안녕! 접속해 줘서 고마워요. UI 업데이트는 어떻게 진행되고 있나요? 금요일 일정대로 문제없이 갈까요?",
    keyExpressions: [
      { en: "We're mostly on track, except for one small blocker.", ko: "한 가지 작은 이슈만 빼면 거의 일정대로 진행 중입니다." },
      { en: "I'm wrapping up the review by this afternoon.", ko: "오늘 오후까지 리뷰를 마무리할 예정입니다." },
      { en: "Could you take a quick look when you have a minute?", ko: "잠깐 시간 되실 때 한번 봐주실 수 있나요?" },
    ],
    starterReplies: [
      "Hey Alex! I finished the main layout yesterday, and I'm wrapping up testing today. Should be ready by Friday.",
      "Hi! Almost there, though I ran into a minor issue with the API. Could we sync for five minutes after this?",
    ],
  },
  {
    id: "conv-3",
    titleKo: "해외 호텔 체크인 & 룸 요청",
    subtitleKo: "조용한 객실 요청과 조식 시간 확인하기",
    contextEn: "You just arrived at a boutique hotel in London after a long flight and want to check in, ask for a quiet room, and check breakfast hours.",
    openingEn: "Welcome to The Greenwood Hotel! Do you have a reservation under your name, and how was your flight?",
    openingKo: "그린우드 호텔에 오신 것을 환영합니다! 성함으로 예약되어 있으신가요, 비행은 어떠셨나요?",
    keyExpressions: [
      { en: "If possible, could I get a quiet room away from the elevator?", ko: "가능하다면 엘리베이터에서 떨어진 조용한 방으로 배정받을 수 있을까요?" },
      { en: "What time is breakfast served?", ko: "조식은 몇 시부터 몇 시까지인가요?" },
      { en: "Is late check-out available?", ko: "레이트 체크아웃이 가능한가요?" },
    ],
    starterReplies: [
      "Hi! Yes, I have a reservation. The flight was a bit long, so if possible, could I get a quiet room on a higher floor?",
      "Hello! I booked a room for three nights. Also, could you let me know what time breakfast starts?",
    ],
  },
];

export const DAILY_SENTENCES_BANK: DailySentence[] = [
  {
    id: "ds-1",
    date: "today",
    track: "conversation",
    en: "I'm still getting the hang of it, bit by bit.",
    ko: "조금씩 감을 잡아가고 있는 중이에요.",
    nuanceKo: "새로운 일이나 영어 공부를 막 시작해서 서툴지만 차츰 익숙해질 때 원어민이 정말 자주 쓰는 표현입니다.",
    keyExpression: "get the hang of ~ (~의 요령·감을 잡다)",
  },
  {
    id: "ds-2",
    date: "today",
    track: "writing",
    en: "Let's play it by ear depending on how the weather turns out.",
    ko: "날씨가 어떻게 되는지 보고 유동적으로 정하자.",
    nuanceKo: "미리 딱 정하지 않고 상황에 맞춰 결정하자는 뜻으로, 일상 약속이나 가벼운 업무 조율에 모두 어울립니다.",
    keyExpression: "play it by ear (상황을 보며 즉흥적으로 대처하다)",
  },
  {
    id: "ds-3",
    date: "today",
    track: "grammar",
    en: "Had I known earlier, I would have adjusted the schedule.",
    ko: "좀 더 일찍 알았더라면 일정을 조정했을 텐데요.",
    nuanceKo: "If I had known에서 If를 생략하고 도치한 고급 가정법 과거완료 표현입니다.",
    keyExpression: "Had I known ~ (= If I had known ~)",
  },
];

export const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q-gram-1",
    track: "grammar",
    questionKo: "다음 중 문법적으로 가장 자연스럽고 올바른 문장은 무엇인가요?",
    promptEn: "Choose the grammatically correct sentence:",
    options: [
      "I am looking forward to see you soon.",
      "I am looking forward to seeing you soon.",
      "I am looking forward seeing you soon.",
      "I look forward for seeing you soon.",
    ],
    correctIndex: 1,
    explanationKo: "'look forward to'에서 to는 전치사이므로 뒤에 동사원형이 아니라 동명사(seeing)나 명사가 와야 합니다.",
    keySentenceEn: "I am looking forward to seeing you soon.",
    keySentenceKo: "곧 만나 뵙기를 고대하고 있습니다.",
  },
  {
    id: "q-write-1",
    track: "writing",
    questionKo: "'갑작스러운 일정이 생겨서 미팅을 미뤄야 할 것 같아요'를 가장 자연스럽게 영작한 것은?",
    promptEn: "Select the most natural English sentence:",
    options: [
      "Because sudden schedule happened, I must delay meeting.",
      "Something urgent came up, so I might need to push back our meeting.",
      "An unexpected plan was occurred, so let's postpone the meet.",
      "I got a sudden promise, so I should cancel our meeting time.",
    ],
    correctIndex: 1,
    explanationKo: "'갑작스러운 일이 생겼다'는 Something came up, '일정을 미루다'는 push back 또는 reschedule을 쓰면 훨씬 원어민답습니다.",
    keySentenceEn: "Something urgent came up, so I might need to push back our meeting.",
    keySentenceKo: "급한 일이 생겨서 회의를 조금 미뤄야 할 것 같습니다.",
  },
  {
    id: "q-conv-1",
    track: "conversation",
    questionKo: "친구가 '이번 주말 바빠?'라고 물었을 때 '딱히 정해진 건 없고 그냥 쉬려고'로 알맞은 답은?",
    promptEn: "A: Are you busy this weekend?  B: ____",
    options: [
      "Nothing set in stone yet. I'm probably just going to take it easy.",
      "I have no promise, so I will take a rest in my house.",
      "I am very free because my schedule is empty completely.",
      "Nothing is decided, therefore I will spend time lazily.",
    ],
    correctIndex: 0,
    explanationKo: "'Nothing set in stone yet(아직 확정된 건 없어)'과 'take it easy(편하게 쉬다)' 조합이 원어민 일상 회화에서 가장 자연스럽습니다.",
    keySentenceEn: "Nothing set in stone yet. I'm probably just going to take it easy.",
    keySentenceKo: "아직 확정된 건 없어요. 아마 그냥 편하게 쉴 것 같아요.",
  },
  {
    id: "q-gram-2",
    track: "grammar",
    questionKo: "빈칸에 들어갈 가장 적절한 표현을 고르세요.",
    promptEn: "By the time we arrived at the station, the train ____.",
    options: [
      "already left",
      "has already left",
      "had already left",
      "was already leaving",
    ],
    correctIndex: 2,
    explanationKo: "도착한 시점(과거 arrived)보다 기차가 떠난 일이 더 먼저 일어났으므로 대과거(had + p.p.)를 씁니다.",
    keySentenceEn: "By the time we arrived at the station, the train had already left.",
    keySentenceKo: "우리가 역에 도착했을 때 기차는 이미 떠난 뒤였다.",
  },
  {
    id: "q-conv-2",
    track: "conversation",
    questionKo: "상대방의 말이 너무 빨라서 '다시 한 번만 천천히 말씀해 주실래요?'라고 정중히 물을 때는?",
    promptEn: "Choose the most polite and natural request:",
    options: [
      "Speak slowly one more time, please.",
      "I didn't understand your fast English.",
      "Could you say that again a little more slowly?",
      "Tell me again because you talked too fast.",
    ],
    correctIndex: 2,
    explanationKo: "상대방을 탓하지 않고 'Could you say that again a little more slowly?' 또는 'Could you catch that again?' 형태로 부드럽게 요청합니다.",
    keySentenceEn: "Could you say that again a little more slowly?",
    keySentenceKo: "방금 말씀하신 걸 조금만 천천히 다시 말씀해 주시겠어요?",
  },
];
