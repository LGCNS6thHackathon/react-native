import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  INITIAL_USER as user,
  TODAY_SCHEDULE as today,
  INITIAL_NOTICES,
  INITIAL_ASSIGNMENTS,
  INITIAL_EVALUATIONS,
  INITIAL_QNA,
  REPLAY_LECTURES,
  QnaItem,
} from "./src/lms-data";

type Tab =
  | "home"
  | "schedule"
  | "notices"
  | "qa"
  | "evaluation"
  | "assignment"
  | "ai-review"
  | "mypage";
const menus: {
  id: Tab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "home", label: "대시보드", icon: "grid-outline" },
  { id: "schedule", label: "교육 일정", icon: "calendar-outline" },
  { id: "notices", label: "공지사항", icon: "megaphone-outline" },
  { id: "qa", label: "Q&A", icon: "chatbubbles-outline" },
  { id: "evaluation", label: "역량평가", icon: "ribbon-outline" },
  { id: "assignment", label: "과제실", icon: "document-text-outline" },
  { id: "ai-review", label: "AI 복습", icon: "sparkles-outline" },
  { id: "mypage", label: "마이페이지", icon: "person-outline" },
];
const quizzes = [
  {
    question: "Next.js 15에서 초고속 HMR을 지원하는 엔진은?",
    options: ["Webpack", "Vite", "Turbopack", "Rollup"],
    answer: 2,
    explanation:
      "Turbopack은 Rust 기반의 번들러로 빠른 개발 빌드와 HMR을 지원합니다.",
  },
  {
    question: "Tailwind CSS v4의 테마 선언 지시어는?",
    options: ["@theme inline", "@config theme", "@apply variables"],
    answer: 0,
    explanation: "CSS에서 @theme inline으로 디자인 토큰을 선언합니다.",
  },
  {
    question: "컴포넌트 변형을 관리하는 유틸리티는?",
    options: ["Axios", "class-variance-authority", "React Query"],
    answer: 1,
    explanation: "cva는 컴포넌트의 variant별 스타일을 관리합니다.",
  },
];
const schedule: Record<number, string> = {
  2: "Next.js 15 Server Actions",
  3: "캐싱 & Revalidation",
  4: "Tailwind CSS v4 & 디자인 토큰",
  5: "AWS ECS & 컨테이너 아키텍처",
  6: "테라폼 인프라 자동화",
  9: "웹 프론트엔드 해커톤 · 1일차",
  10: "웹 프론트엔드 해커톤 · 2일차",
  11: "해커톤 데모데이 & 피어리뷰",
  12: "생성형 AI RAG 파이프라인 특강",
  13: "FastAPI 벡터 검색 엔진",
  20: "3차 클라우드 MSA 역량평가",
};
const STORAGE = "inspire-campus-demo-v1";
function Campus() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [tab, setTab] = useState<Tab>("home");
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);
  const [detail, setDetail] = useState<{ title: string; body: string } | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("전체");
  const [day, setDay] = useState(9);
  const [month, setMonth] = useState(10);
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [questions, setQuestions] = useState(INITIAL_QNA);
  const [editor, setEditor] = useState<
    "question" | "assignment" | "appeal" | null
  >(null);
  const [activeAssignment, setActiveAssignment] = useState(202);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notes, setNotes] = useState(
    "Next.js App Router, Tailwind CSS 디자인 토큰, 컴포넌트 변형 관리에 대해 학습했습니다.",
  );
  const [summary, setSummary] = useState<string[]>([
    "Server / Client Component의 역할과 경계 이해",
    "Tailwind CSS v4 디자인 토큰과 테마 활용",
    "재사용 가능한 UI 컴포넌트 설계",
  ]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((value) => {
        if (value) {
          const data = JSON.parse(value);
          if (data.assignments) setAssignments(data.assignments);
          if (data.questions) setQuestions(data.questions);
          if (typeof data.dark === "boolean") setDark(data.dark);
        }
      })
      .catch(() =>
        Alert.alert(
          "저장 데이터",
          "저장된 데이터를 읽지 못해 기본 더미데이터로 시작합니다.",
        ),
      )
      .finally(() => setReady(true));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (ready)
      AsyncStorage.setItem(
        STORAGE,
        JSON.stringify({ assignments, questions, dark }),
      ).catch(() =>
        Alert.alert("저장 실패", "이번 변경은 앱 종료 전까지 유지됩니다."),
      );
  }, [assignments, questions, dark, ready]);
  const c = dark
    ? {
        bg: "#090d16",
        card: "#111b2e",
        text: "#f8fafc",
        muted: "#9aaac2",
        line: "#26334a",
        soft: "#1d2942",
      }
    : {
        bg: "#f6f7fb",
        card: "#ffffff",
        text: "#0f172a",
        muted: "#64748b",
        line: "#e5e9f2",
        soft: "#eef0ff",
      };
  const go = (next: Tab) => {
    setTab(next);
    setMenu(false);
    setSearch("");
    setFilter("전체");
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const pending = assignments.filter((item) => item.status === "미제출").length;
  const txt = (value: string, style?: any) => (
    <Text style={[s.text, { color: c.text }, style]}>{value}</Text>
  );
  const muted = (value: string) =>
    txt(value, { color: c.muted, fontSize: 12, lineHeight: 20 });
  const badge = (value: string, green = false) => (
    <View
      style={[
        s.badge,
        { backgroundColor: green ? (dark ? "#163c34" : "#e9f8f1") : c.soft },
      ]}
    >
      <Text
        style={{
          color: green ? "#15976b" : dark ? "#b1b5ff" : "#4f46e5",
          fontSize: 11,
          fontWeight: "700",
        }}
      >
        {value}
      </Text>
    </View>
  );
  const button = (label: string, action: () => void, secondary = false) => (
    <Pressable
      accessibilityRole="button"
      onPress={action}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: secondary ? c.soft : "#4f46e5",
          opacity: pressed ? 0.65 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: secondary ? (dark ? "#c7caff" : "#4f46e5") : "#fff",
          fontWeight: "700",
          fontSize: 13,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
  const card = (children: React.ReactNode, style?: any, key?: React.Key) => (
    <View
      key={key}
      style={[s.card, { backgroundColor: c.card, borderColor: c.line }, style]}
    >
      {children}
    </View>
  );
  const heading = (label: string, action?: () => void) => (
    <View style={s.between}>
      {txt(label, s.section)}
      {action && (
        <Pressable accessibilityRole="button" onPress={action} hitSlop={10}>
          {txt("전체보기 →", { color: "#6366f1", fontSize: 12 })}
        </Pressable>
      )}
    </View>
  );
  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      setDetail({
        title: "링크를 열 수 없습니다",
        body: "브라우저를 열지 못했습니다. 네트워크 연결과 기기의 브라우저 설정을 확인한 뒤 다시 시도해주세요.",
      });
    }
  };
  const input = (
    value: string,
    onChangeText: (v: string) => void,
    placeholder: string,
    multiline = false,
  ) => (
    <TextInput
      accessibilityLabel={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.muted}
      multiline={multiline}
      style={[
        s.input,
        { color: c.text, borderColor: c.line, backgroundColor: c.bg },
        multiline && { minHeight: 120, textAlignVertical: "top" },
      ]}
    />
  );
  const noticeRows = (limit?: number) =>
    INITIAL_NOTICES.filter(
      (n) =>
        (filter === "전체" || n.category === filter) &&
        (n.title + n.content).toLowerCase().includes(search.toLowerCase()),
    )
      .slice(0, limit)
      .map((n) => (
        <Pressable
          key={n.id}
          accessibilityRole="button"
          onPress={() =>
            setDetail({
              title: n.title,
              body: `${n.author} · ${n.createdAt}\n\n${n.content}`,
            })
          }
          style={[s.listRow, { borderColor: c.line }]}
        >
          <View style={s.row}>
            {badge(n.category)}
            {n.isNew &&
              txt("NEW", { fontSize: 10, color: "#ef6464", fontWeight: "800" })}
          </View>
          {txt(n.title, { fontWeight: "600", lineHeight: 22 })}
          {muted(`${n.author}  ·  ${n.createdAt}   ›`)}
        </Pressable>
      ));
  const renderHome = () => (
    <>
      <View style={s.hero}>
        <View style={s.between}>
          <Text style={s.heroEyebrow}>AM INSPIRE CAMP · 6기</Text>
          <View style={s.live}>
            <Text style={{ color: "#a7f3d0", fontSize: 11 }}>● 출석 완료</Text>
          </View>
        </View>
        <Text style={s.heroTitle}>안녕하세요, {user.name} 님 👋</Text>
        <Text style={s.heroSubtitle}>오늘도 한 걸음 더 성장해 볼까요?</Text>
        <View style={s.heroDivider} />
        <Text style={s.heroEyebrow}>DAY 69 / 120 · 해커톤 1일차</Text>
        <Text style={s.heroCourse}>{today.subject}</Text>
        <Text style={s.heroMeta}>◷ 09:00 – 18:00 · 김민수 마스터 멘토</Text>
        {button("ZEP 가상 강의실 입장  ↗", () => openLink(today.zepUrl))}
        <View style={s.row}>
          <View style={s.flex}>
            {button("자리이탈감지", () => openLink(today.detectUrl), true)}
          </View>
          <View style={s.flex}>
            {button("강의자료 ↗", () => openLink(today.materialUrl), true)}
          </View>
        </View>
      </View>
      <View style={s.grid}>
        {[
          {
            label: "누적 출석률",
            value: "98.5%",
            sub: "단위기간 출석 100%",
            color: "#10b981",
            progress: 98.5,
            to: "mypage",
          },
          {
            label: "전체 교육 진도",
            value: "58%",
            sub: "556 / 960시간",
            color: "#6366f1",
            progress: 58,
            to: "schedule",
          },
          {
            label: "미제출 과제",
            value: `${pending}건`,
            sub: "가장 가까운 마감 D-4",
            color: "#f59e0b",
            to: "assignment",
          },
          {
            label: "AI 데일리 복습",
            value: "오늘의 퀴즈",
            sub: `${Object.keys(answers).length} / 3문항 풀이`,
            color: "#8b5cf6",
            to: "ai-review",
          },
        ].map((item) => (
          <Pressable
            key={item.label}
            onPress={() => go(item.to as Tab)}
            accessibilityRole="button"
            style={[
              s.metric,
              {
                backgroundColor: c.card,
                borderColor: c.line,
                width: wide ? "23.8%" : "48%",
              },
            ]}
          >
            {muted(item.label)}
            {txt(item.value, {
              fontSize: 25,
              fontWeight: "800",
              marginVertical: 8,
              color: item.color,
            })}
            {item.progress !== undefined && (
              <View style={[s.track, { backgroundColor: c.soft }]}>
                <View
                  style={{
                    height: 5,
                    width: `${item.progress}%`,
                    backgroundColor: item.color,
                    borderRadius: 4,
                  }}
                />
              </View>
            )}
            {muted(item.sub)}
          </Pressable>
        ))}
      </View>
      {card(
        <>
          {heading("주요 공지사항", () => go("notices"))}
          {noticeRows(3)}
        </>,
      )}
      {card(
        <>
          {heading("오늘의 타임라인")}
          {[
            "09:00 – 10:00|해커톤 킥오프 & 기획안 리뷰",
            "10:00 – 16:30|팀별 프로토타이핑 & 멘토 코칭",
            "16:30 – 18:00|코드 커밋 & 데일리 회고",
          ].map((line, i) => (
            <View
              key={line}
              style={[
                s.timeline,
                { borderColor: i === 1 ? "#6366f1" : c.line },
              ]}
            >
              {muted(line.split("|")[0])}
              {txt(line.split("|")[1], { fontWeight: "600" })}
              {i === 1 && badge("진행 중")}
            </View>
          ))}
          {badge("11월 훈련수당 지급 대상", true)}
          {muted("단위기간 100% 출석 · 최대 316,000원 지급 요건 충족")}
        </>,
      )}
    </>
  );
  const renderSchedule = () => {
    const days = new Date(2026, month + 1, 0).getDate();
    const offset = new Date(2026, month, 1).getDay();
    return (
      <>
        {card(
          <>
            <View style={s.between}>
              {button(
                "‹",
                () => {
                  setMonth(month - 1);
                  setDay(1);
                },
                true,
              )}
              {txt(
                `${new Date(2026, month, 1).getFullYear()}년 ${new Date(2026, month, 1).getMonth() + 1}월`,
                s.section,
              )}
              {button(
                "›",
                () => {
                  setMonth(month + 1);
                  setDay(1);
                },
                true,
              )}
            </View>
            <View style={s.calendar}>
              {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                <View key={d} style={s.cell}>
                  {muted(d)}
                </View>
              ))}
              {Array.from({ length: offset }, (_, i) => (
                <View key={`blank${i}`} style={s.cell} />
              ))}
              {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${d}일 ${month === 10 ? schedule[d] || "교육 일정 없음" : ""}`}
                  accessibilityState={{ selected: day === d }}
                  key={d}
                  onPress={() => setDay(d)}
                  style={[
                    s.cell,
                    day === d && {
                      backgroundColor: "#4f46e5",
                      borderRadius: 14,
                    },
                  ]}
                >
                  {txt(String(d), {
                    color: day === d ? "#fff" : c.text,
                    fontWeight: d === 9 ? "800" : "400",
                  })}
                  <View
                    style={{
                      height: 4,
                      width: 4,
                      borderRadius: 2,
                      backgroundColor:
                        month === 10 && schedule[d]
                          ? day === d
                            ? "#fff"
                            : "#6366f1"
                          : "transparent",
                    }}
                  />
                </Pressable>
              ))}
            </View>
            {muted("● 교육 일정   ·   날짜를 눌러 상세 출결을 확인하세요.")}
          </>,
        )}
        {card(
          <>
            {heading(
              `${new Date(2026, month, 1).getMonth() + 1}월 ${day}일 일정`,
            )}
            {month === 10 && schedule[day] ? (
              <>
                {badge(
                  day < 9
                    ? day === 5
                      ? "지각"
                      : "출석"
                    : day === 9
                      ? "출석"
                      : "예정",
                  day <= 9,
                )}
                {txt(schedule[day], s.section)}
                {muted("09:00 – 18:00 · 온·오프라인 병행")}
                {day <= 9 && (
                  <>
                    {muted(
                      `입실 ${day === 5 ? "09:08:12" : "08:52:14"} · 퇴실 ${day === 9 ? "진행 중" : "18:05:10"}`,
                    )}
                    {button(
                      "출결 소명 신청",
                      () => {
                        setBody("");
                        setEditor("appeal");
                      },
                      true,
                    )}
                  </>
                )}
              </>
            ) : (
              muted("등록된 교육 일정이 없습니다.")
            )}
          </>,
        )}
        {card(
          <>
            {heading("지난 강의 다시보기")}
            {REPLAY_LECTURES.map((r) => (
              <Pressable
                key={r.id}
                onPress={() =>
                  setDetail({
                    title: r.title,
                    body: `${r.instructor} · ${r.duration}\n\n핵심 주제\n${r.keyTopics.join("\n")}\n\n더미 강의입니다. 실제 영상은 연결되어 있지 않습니다.`,
                  })
                }
                style={[s.listRow, { borderColor: c.line }]}
              >
                {badge("▶ 다시보기")}
                {txt(r.title, { fontWeight: "600" })}
                {muted(`${r.instructor} · ${r.duration}`)}
              </Pressable>
            ))}
          </>,
        )}
      </>
    );
  };
  const renderAssignments = () => (
    <>
      {card(
        <>
          {heading("나의 과제")}
          {muted(`전체 ${assignments.length}건 · 미제출 ${pending}건`)}
          {chips(["전체", "미제출", "제출완료", "채점완료"])}
        </>,
      )}
      {assignments
        .filter((a) => filter === "전체" || a.status === filter)
        .map((a) =>
          card(
            <>
              <View style={s.between}>
                {badge(a.status, a.status !== "미제출")}
                {muted(a.dDay)}
              </View>
              {txt(a.title, s.section)}
              {muted(`${a.subject} · ${a.author}`)}
              {muted(`마감 ${a.dueDate}`)}
              {txt(a.description, { lineHeight: 23 })}
              {a.feedback && (
                <View style={[s.feedback, { backgroundColor: c.soft }]}>
                  {txt(`멘토 피드백 · ${a.feedback.score}`, {
                    fontWeight: "700",
                  })}
                  {muted(a.feedback.comment)}
                </View>
              )}
              {!!a.submissionDate && muted(`제출 일시 ${a.submissionDate}`)}
              {button(
                a.status === "미제출" ? "과제 제출하기" : "제출 내용 수정",
                () => {
                  setActiveAssignment(a.id);
                  setBody("");
                  setEditor("assignment");
                },
                a.status !== "미제출",
              )}
            </>,
            { marginBottom: 16 },
            a.id,
          ),
        )}
    </>
  );
  const chips = (items: string[]) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {items.map((item) => (
        <Pressable
          key={item}
          onPress={() => setFilter(item)}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === item }}
          style={[
            s.badge,
            {
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: filter === item ? "#4f46e5" : c.soft,
            },
          ]}
        >
          {txt(item, {
            fontSize: 12,
            color: filter === item ? "#fff" : c.muted,
          })}
        </Pressable>
      ))}
    </ScrollView>
  );
  const renderQa = () => (
    <>
      {input(search, setSearch, "질문 검색")}
      {button("＋ 질문 작성하기", () => {
        setTitle("");
        setBody("");
        setEditor("question");
      })}
      {chips(["전체", "답변완료", "답변대기"])}
      {questions
        .filter(
          (q) =>
            (filter === "전체" || q.status === filter) &&
            (q.title + q.content).toLowerCase().includes(search.toLowerCase()),
        )
        .map((q) =>
          card(
            <Pressable
              onPress={() =>
                setDetail({
                  title: q.title,
                  body: `${q.author} · ${q.createdAt}\n\n${q.content}\n\n${q.answers.length ? q.answers.map((a) => `${a.author} (${a.role})\n${a.content}`).join("\n\n") : "아직 답변이 없습니다."}`,
                })
              }
              style={{ gap: 10 }}
            >
              <View style={s.between}>
                {badge(q.category)}
                {badge(q.status, q.status === "답변완료")}
              </View>
              {txt(q.title, { fontWeight: "700", lineHeight: 23 })}
              {muted(`${q.author} · ${q.createdAt}`)}
              {muted(`답변 ${q.answers.length}  ·  조회 ${q.views}`)}
            </Pressable>,
            { marginBottom: 14 },
            q.id,
          ),
        )}
      {questions.filter(
        (q) =>
          (filter === "전체" || q.status === filter) &&
          (q.title + q.content).toLowerCase().includes(search.toLowerCase()),
      ).length === 0 && muted("검색 결과가 없습니다.")}
    </>
  );
  const renderEvaluation = () => (
    <>
      {INITIAL_EVALUATIONS.map((e) =>
        card(
          <>
            {badge(`${e.round} 역량평가`)}
            {txt(e.title, s.section)}
            {muted(e.testDate)}
            <View style={s.between}>
              {txt(`${e.myScore}점`, {
                fontSize: 40,
                fontWeight: "800",
                color: "#6366f1",
              })}
              {badge(e.rank, true)}
            </View>
            {muted(`평균 ${e.avgScore}점 · 최고 ${e.highestScore}점`)}
            {e.radarMetrics.map((m) => (
              <View key={m.subject} style={{ gap: 7 }}>
                <View style={s.between}>
                  {muted(m.subject)}
                  {txt(`${m.myScore} / 평균 ${m.avgScore}`, { fontSize: 11 })}
                </View>
                <View style={[s.track, { backgroundColor: c.soft }]}>
                  <View
                    style={{
                      width: `${m.myScore}%`,
                      height: 5,
                      backgroundColor: "#6366f1",
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
            ))}
            <View style={[s.feedback, { backgroundColor: c.soft }]}>
              {txt("학습 피드백", { fontWeight: "700" })}
              {muted(e.feedback)}
            </View>
          </>,
          { marginBottom: 16 },
          e.id,
        ),
      )}
    </>
  );
  const renderReview = () => (
    <>
      {card(
        <>
          {badge("✦ AI 데일리 복습")}
          {heading("배운 내용을 나의 지식으로")}
          {muted(
            "학습 노트를 적고 핵심 요약과 퀴즈로 복습하세요. 이 화면은 로컬 데모로 동작합니다.",
          )}
          {input(notes, setNotes, "오늘 배운 내용을 입력하세요", true)}
          {loading ? (
            <ActivityIndicator color="#6366f1" />
          ) : (
            button("학습 노트 요약하기", () => {
              if (!notes.trim()) return Alert.alert("노트를 입력해주세요");
              setLoading(true);
              timer.current = setTimeout(() => {
                setSummary(
                  notes
                    .split(/[.。\n]/)
                    .map((v) => v.trim())
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((v) => `학습 포인트: ${v}`),
                );
                setLoading(false);
              }, 600);
            })
          )}
          {summary.map((line, i) => (
            <View key={i} style={s.row}>
              {badge(`0${i + 1}`)}
              <View style={s.flex}>{txt(line, { lineHeight: 23 })}</View>
            </View>
          ))}
        </>,
      )}
      {card(
        <>
          {heading("오늘의 복습 퀴즈")}
          {muted(
            `${Object.keys(answers).length} / 3 완료 · ${quizzes.filter((q, i) => answers[i] === q.answer).length}문항 정답`,
          )}
          {quizzes.map((q, i) => (
            <View key={q.question} style={[s.listRow, { borderColor: c.line }]}>
              {txt(`${i + 1}. ${q.question}`, {
                fontWeight: "700",
                lineHeight: 24,
              })}
              {q.options.map((option, index) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: answers[i] === index }}
                  key={option}
                  onPress={() =>
                    setAnswers((prev) => ({ ...prev, [i]: index }))
                  }
                  style={[
                    s.option,
                    {
                      borderColor: answers[i] === index ? "#6366f1" : c.line,
                      backgroundColor: answers[i] === index ? c.soft : c.card,
                    },
                  ]}
                >
                  {txt(`${String.fromCharCode(65 + index)}.  ${option}`)}
                </Pressable>
              ))}
              {answers[i] !== undefined && (
                <>
                  {badge(
                    answers[i] === q.answer
                      ? "정답입니다!"
                      : "다시 생각해 보세요",
                    answers[i] === q.answer,
                  )}
                  {muted(q.explanation)}
                </>
              )}
            </View>
          ))}
          {button("퀴즈 다시 풀기", () => setAnswers({}), true)}
        </>,
      )}
    </>
  );
  const renderProfile = () => (
    <>
      {card(
        <>
          <View style={s.row}>
            <View style={s.avatar}>
              {txt("윤", { color: "#fff", fontSize: 24, fontWeight: "800" })}
            </View>
            <View style={s.flex}>
              {txt(`${user.name} 님`, s.section)}
              {muted(`${user.course} ${user.generation}`)}
            </View>
          </View>
          {badge("수강 중", true)}
          {muted(user.email)}
          {muted(user.phone)}
        </>,
      )}
      {card(
        <>
          {heading("출결 현황")}
          <View style={s.between}>
            {txt("98.5%", {
              fontSize: 36,
              fontWeight: "800",
              color: "#10b981",
            })}
            {badge("수당 기준 충족", true)}
          </View>
          {muted(
            `출석 ${user.attendedDays}일  ·  지각 ${user.lateDays}회  ·  결석 ${user.absentDays}회`,
          )}
          {muted(`전체 ${user.totalTrainingDays}일 · 단위기간 출석 100%`)}
        </>,
      )}
      {card(
        <>
          {heading("훈련수당 계좌")}
          {txt(`${user.allowanceBank} · ${user.allowanceAccount}`)}
          {muted("11월 예상 수당 316,000원")}
          {muted(
            "화면의 개인정보와 계정은 frontend에서 가져온 더미데이터입니다.",
          )}
        </>,
      )}
      {card(
        <>
          {heading("AWS 실습 계정")}
          {muted(`계정 ID  ${user.awsAccountId}`)}
          {muted(`IAM 사용자  ${user.awsIamUser}`)}
          {muted(`리전  ${user.awsRegion}`)}
        </>,
      )}
      {card(
        <>
          <View style={s.between}>
            {heading("다크 모드")}
            <Switch
              accessibilityLabel="다크 모드"
              value={dark}
              onValueChange={setDark}
              trackColor={{ true: "#6366f1" }}
            />
          </View>
          {button(
            "더미데이터 초기화",
            () => {
              setAssignments(INITIAL_ASSIGNMENTS);
              setQuestions(INITIAL_QNA);
              setAnswers({});
              setDetail({
                title: "초기화 완료",
                body: "과제, 질문, 퀴즈가 기본 더미데이터로 돌아갔습니다.",
              });
            },
            true,
          )}
        </>,
      )}
    </>
  );
  const saveEditor = () => {
    if (!body.trim() || (editor === "question" && !title.trim()))
      return Alert.alert(
        "내용을 입력해주세요",
        "필수 입력 항목을 모두 작성해주세요.",
      );
    if (editor === "question") {
      const q: QnaItem = {
        id: Date.now(),
        title: title.trim(),
        content: body.trim(),
        author: user.name,
        category: "일반",
        createdAt: new Date().toLocaleDateString("ko-KR"),
        status: "답변대기",
        views: 0,
        likes: 0,
        answers: [],
      };
      setQuestions((prev) => [q, ...prev]);
      setFilter("전체");
      setSearch("");
    } else if (editor === "assignment") {
      if (!/^https?:\/\/[^\s]+$/i.test(body.trim()))
        return Alert.alert(
          "링크 확인",
          "http:// 또는 https://로 시작하는 제출 URL을 입력해주세요.",
        );
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === activeAssignment
            ? {
                ...a,
                status: "제출완료",
                dDay: "제출완료",
                submissionDate: new Date().toLocaleString("ko-KR"),
                description: `${a.description.split("\n\n제출 URL:")[0]}\n\n제출 URL: ${body.trim()}`,
              }
            : a,
        ),
      );
    }
    setEditor(null);
    setDetail({
      title: editor === "appeal" ? "소명 신청 완료" : "저장 완료",
      body:
        editor === "appeal"
          ? `${month + 1}월 ${day}일 소명 사유가 데모에서 접수되었습니다.\n\n${body}\n\n실제 행정팀에 전송되지 않습니다.`
          : "변경 내용을 이 기기에 저장했습니다.",
    });
  };
  const nav = (compact = false) =>
    menus.map((item) => (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: tab === item.id }}
        key={item.id}
        onPress={() => go(item.id)}
        style={[
          s.navItem,
          compact && { width: "47%" },
          tab === item.id && { backgroundColor: c.soft },
        ]}
      >
        <Ionicons
          name={item.icon}
          size={20}
          color={tab === item.id ? "#6366f1" : c.muted}
        />
        {txt(item.label, {
          fontSize: 14,
          fontWeight: tab === item.id ? "700" : "500",
        })}
      </Pressable>
    ));
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: c.bg }}
      edges={["top", "left", "right"]}
    >
      <StatusBar style={dark ? "light" : "dark"} />
      <View
        style={[s.header, { backgroundColor: c.card, borderColor: c.line }]}
      >
        <View style={s.row}>
          <Image
            source={require("./assets/logo.png")}
            style={s.brand}
            resizeMode="contain"
            accessibilityLabel="Inspire Campus 로고"
          />
          <View>
            {txt("inspire campus", {
              fontSize: 17,
              fontWeight: "800",
              letterSpacing: -0.5,
            })}
            {muted("LG CNS AM Inspire Camp")}
          </View>
        </View>
        <View style={s.row}>
          <Pressable
            accessibilityLabel="공지사항 열기"
            onPress={() => go("notices")}
            hitSlop={10}
          >
            <Ionicons name="notifications-outline" size={23} color={c.text} />
          </Pressable>
          <Pressable
            accessibilityLabel="마이페이지 열기"
            onPress={() => go("mypage")}
            style={s.smallAvatar}
          >
            <Text style={{ color: "#6366f1", fontWeight: "800" }}>윤</Text>
          </Pressable>
        </View>
      </View>
      <View style={{ flex: 1, flexDirection: "row" }}>
        {wide && (
          <View
            style={[
              s.sidebar,
              { backgroundColor: c.card, borderColor: c.line },
            ]}
          >
            {muted("LEARNING PORTAL")}
            {nav()}
            <View style={{ marginTop: "auto" }}>
              {muted("나의 배움이 내일의 가능성으로")}
              {badge("AM Inspire Camp · 6기")}
            </View>
          </View>
        )}
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.content,
            { padding: width < 360 ? 14 : 22 },
          ]}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 1100,
              alignSelf: "center",
              gap: 20,
            }}
          >
            <View>
              <Text
                style={{
                  color: "#6366f1",
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 1.3,
                }}
              >
                MY LEARNING SPACE
              </Text>
              {txt(menus.find((m) => m.id === tab)!.label, {
                fontSize: 26,
                fontWeight: "800",
                marginTop: 6,
              })}
              {muted(
                tab === "home"
                  ? "2026년 11월 9일 월요일 · 나의 학습을 한눈에"
                  : "배움의 모든 순간을 함께해요.",
              )}
            </View>
            {!ready ? (
              <ActivityIndicator color="#6366f1" />
            ) : tab === "home" ? (
              renderHome()
            ) : tab === "schedule" ? (
              renderSchedule()
            ) : tab === "notices" ? (
              <>
                {input(search, setSearch, "공지 제목 또는 내용 검색")}
                {chips(["전체", "필독", "공지", "자료", "시스템"])}
                {card(
                  <>
                    {noticeRows()}
                    {noticeRows().length === 0 &&
                      muted("검색 결과가 없습니다.")}
                  </>,
                )}
              </>
            ) : tab === "assignment" ? (
              renderAssignments()
            ) : tab === "qa" ? (
              renderQa()
            ) : tab === "evaluation" ? (
              renderEvaluation()
            ) : tab === "ai-review" ? (
              renderReview()
            ) : (
              renderProfile()
            )}
            <Text
              style={{
                color: c.muted,
                textAlign: "center",
                fontSize: 10,
                marginVertical: 14,
              }}
            >
              © 2026 LG CNS AM Inspire Camp · 수강생 포털
            </Text>
          </View>
        </ScrollView>
      </View>
      {!wide && (
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: c.card }}>
          <View style={[s.bottom, { borderColor: c.line }]}>
            {[menus[0], menus[1], menus[5], menus[6]].map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: tab === item.id }}
                onPress={() => go(item.id)}
                style={s.bottomItem}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={tab === item.id ? "#6366f1" : c.muted}
                />
                {txt(item.label, {
                  fontSize: 10,
                  color: tab === item.id ? "#6366f1" : c.muted,
                  fontWeight: "600",
                })}
              </Pressable>
            ))}
            <Pressable
              accessibilityLabel="전체 메뉴"
              onPress={() => setMenu(true)}
              style={s.bottomItem}
            >
              <Ionicons name="menu-outline" size={24} color={c.muted} />
              {muted("전체")}
            </Pressable>
          </View>
        </SafeAreaView>
      )}
      <Modal
        visible={menu || !!detail || !!editor}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setMenu(false);
          setDetail(null);
          setEditor(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.overlay}
        >
          <Pressable
            accessibilityLabel="닫기"
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setMenu(false);
              setDetail(null);
              setEditor(null);
            }}
          />
          <SafeAreaView
            edges={["bottom"]}
            style={[s.sheet, { backgroundColor: c.card, maxWidth: 640 }]}
          >
            <View style={s.between}>
              {txt(
                menu
                  ? "전체 메뉴"
                  : editor
                    ? editor === "question"
                      ? "질문 작성"
                      : editor === "assignment"
                        ? "과제 제출"
                        : "출결 소명 신청"
                    : detail?.title || "",
                s.section,
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="닫기"
                hitSlop={12}
                onPress={() => {
                  setMenu(false);
                  setDetail(null);
                  setEditor(null);
                }}
              >
                <Ionicons name="close" size={24} color={c.text} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
            >
              {menu ? (
                <>
                  <View style={s.grid}>{nav(true)}</View>
                  <View style={s.between}>
                    {txt("다크 모드")}
                    <Switch value={dark} onValueChange={setDark} />
                  </View>
                </>
              ) : editor ? (
                <>
                  {editor === "question" && input(title, setTitle, "질문 제목")}
                  {input(
                    body,
                    setBody,
                    editor === "assignment"
                      ? "GitHub 또는 배포 URL (https://…)"
                      : editor === "appeal"
                        ? "소명 사유를 입력하세요"
                        : "질문 내용을 입력하세요",
                    editor !== "assignment",
                  )}
                  {button("저장하기", saveEditor)}
                  {muted(
                    "더미데이터로 동작하며 외부 서버로 전송되지 않습니다.",
                  )}
                </>
              ) : (
                txt(detail?.body || "", { lineHeight: 26 })
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Campus />
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  text: { fontSize: 14 },
  flex: { flex: 1, minWidth: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  brand: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#eef0ff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  sidebar: { width: 224, padding: 20, gap: 10, borderRightWidth: 1 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    minHeight: 48,
  },
  content: { paddingBottom: 24 },
  card: { padding: 20, borderRadius: 20, borderWidth: 1, gap: 14 },
  section: { fontSize: 16, fontWeight: "700", flexShrink: 1, lineHeight: 24 },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { backgroundColor: "#171b46", padding: 22, borderRadius: 23, gap: 14 },
  heroEyebrow: {
    fontSize: 10,
    color: "#bbc0f5",
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  heroTitle: { fontSize: 23, fontWeight: "800", color: "#fff", lineHeight: 32 },
  heroSubtitle: { fontSize: 13, color: "#b7bfdf" },
  heroCourse: {
    fontSize: 19,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 29,
  },
  heroMeta: { fontSize: 11, color: "#c7ceeb", lineHeight: 19 },
  heroDivider: { height: 1, backgroundColor: "#36395b", marginVertical: 2 },
  live: {
    backgroundColor: "#23443e",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  metric: { padding: 16, borderRadius: 18, borderWidth: 1, minHeight: 136 },
  track: { height: 5, borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  listRow: { paddingVertical: 16, borderBottomWidth: 1, gap: 10 },
  timeline: { borderLeftWidth: 3, paddingLeft: 16, paddingVertical: 5, gap: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 48,
  },
  feedback: { padding: 16, borderRadius: 12, gap: 8 },
  calendar: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: "14.285714%",
    height: 49,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  option: { padding: 14, borderWidth: 1, borderRadius: 12, minHeight: 48 },
  bottom: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 8,
  },
  bottomItem: { flex: 1, alignItems: "center", gap: 5, minHeight: 48 },
  overlay: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxHeight: "85%",
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 22,
  },
});
