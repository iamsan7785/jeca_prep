import { ArrowRight, BookOpen, Bookmark, CalendarClock, Check, ChevronDown, CircleHelp, Filter, Play, Search, SlidersHorizontal, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { officialPaperReferences, questionBank, supportedSubjects } from "@jeca/shared/questions";
import type { Question } from "@jeca/shared/types";
import { BookmarkButton, Button, Card, DifficultyBadge, EmptyState, SourceBadge } from "../components/ui";
import { useExam } from "../store/ExamContext";

type MockTest = { id: string; title: string; level: string; questionCount: number; durationMinutes: number };

export function MockTestsPage() {
  const { start, active } = useExam(); const navigate = useNavigate(); const [starting, setStarting] = useState(""); const [mocks, setMocks] = useState<MockTest[]>([]);
  useEffect(() => { void fetch("/api/mock-tests").then((response) => response.ok ? response.json() : { items: [] }).then((payload) => setMocks(Array.isArray(payload.items) ? payload.items : [])).catch(() => setMocks([])); }, []);
  const begin = async (mock: MockTest) => { setStarting(mock.id); try { const exam = await start({ testId: mock.id, testName: mock.title, count: mock.questionCount, durationMinutes: mock.durationMinutes }); navigate(`/mock-tests/${exam.testId}`); } finally { setStarting(""); } };
  return <div className="page"><section className="page-heading"><div><span className="eyebrow">Timed simulations</span><h1>Mock tests that feel focused.</h1><p>Original questions, configurable marking, reliable timer state, and detailed review after submission.</p></div>{active && !active.submitted && <Link className="button button-secondary" to={`/mock-tests/${active.testId}`}><TimerReset size={17} /> Resume active test</Link>}</section><Card className="marking-note"><div><CircleHelp size={20} /><div><b>Marking rules are not fixed in the interface.</b><span>These demos use +1 / −0.25 for single-correct and +2 / partial +1 / −0.5 for multiple-correct. The database schema supports per-test admin configuration.</span></div></div></Card><div className="mock-grid">{mocks.map((mock, index) => <Card key={mock.id} className="mock-card"><div className="mock-card-top"><span className="mock-number">{String(index + 1).padStart(2, "0")}</span><span className="badge difficulty-medium">{mock.level}</span></div><h2>{mock.title}</h2><p>{index === 0 ? "Build confidence with a well-rounded simulation across the core syllabus." : index === 1 ? "A fresh mixed set for moving from knowledge to speed." : "Push your accuracy and decision-making under real timing."}</p><div className="mock-details"><span><BookOpen size={15} /> {mock.questionCount} questions</span><span><CalendarClock size={15} /> {mock.durationMinutes} min</span></div><Button onClick={() => void begin(mock)} disabled={Boolean(starting)}>{starting === mock.id ? "Preparing test…" : "Start simulation"}<Play size={16} /></Button></Card>)}</div></div>;
}

export function PracticePage() {
  const { start, bookmarks } = useExam(); const navigate = useNavigate();
  const [subject, setSubject] = useState("All subjects"); const [count, setCount] = useState(20); const [minutes, setMinutes] = useState(30); const [difficulty, setDifficulty] = useState("Mixed");
  const startPractice = async () => { const exam = await start({ testId: `practice-${Date.now()}`, testName: subject === "All subjects" ? "Custom Mixed Practice" : `${subject} Practice`, count, durationMinutes: minutes, subject: subject === "All subjects" ? undefined : subject }); navigate(`/mock-tests/${exam.testId}`); };
  return <div className="page"><section className="page-heading"><div><span className="eyebrow">Practice studio</span><h1>Make every practice set yours.</h1><p>Choose the scope. Start instantly. Review the reasoning while it is still fresh.</p></div></section><div className="practice-grid"><Card className="builder-card"><div className="section-title"><div><span className="eyebrow">Custom session</span><h2>Set your focus</h2></div><SlidersHorizontal size={21} /></div><div className="form-grid"><label>Subject<select value={subject} onChange={(event) => setSubject(event.target.value)}><option>All subjects</option>{supportedSubjects.map((item) => <option key={item}>{item}</option>)}</select></label><label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>Mixed</option><option>Easy</option><option>Medium</option><option>Hard</option></select></label><label>Questions<select value={count} onChange={(event) => setCount(Number(event.target.value))}><option value="10">10 questions</option><option value="20">20 questions</option><option value="30">30 questions</option><option value="50">50 questions</option></select></label><label>Time limit<select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></label></div><div className="builder-summary"><span><Check size={16} /> Original practice questions</span><span><Check size={16} /> Autosaves as you answer</span></div><Button onClick={() => void startPractice()}>Start custom practice <ArrowRight size={16} /></Button></Card><div className="practice-modes"><Link to="/pyq" className="mode-card"><BookOpen /><div><b>PYQ reference library</b><span>Browse official paper references with clear provenance.</span></div><ArrowRight /></Link><Link to="/bookmarks" className="mode-card"><Bookmark /><div><b>Bookmarks</b><span>{bookmarks.length ? `${bookmarks.length} questions saved for later.` : "Save questions you want to return to."}</span></div><ArrowRight /></Link><Link to="/mistakes" className="mode-card"><TimerReset /><div><b>My mistakes</b><span>Use incorrect answers as a targeted revision list.</span></div><ArrowRight /></Link></div></div><QuestionBankPreview /></div>;
}

function QuestionBankPreview() {
  const [search, setSearch] = useState(""); const [subject, setSubject] = useState("All"); const [liveQuestions, setLiveQuestions] = useState<Question[]>([]); const { bookmarks, toggleBookmark } = useExam();
  useEffect(() => { let mounted = true; const refresh = () => { void fetch("/api/questions?limit=110").then((response) => response.ok ? response.json() : { items: [] }).then((payload) => { if (mounted && Array.isArray(payload.items) && payload.items.length) setLiveQuestions(payload.items); }).catch(() => undefined); }; refresh(); const timer = window.setInterval(refresh, 30_000); return () => { mounted = false; window.clearInterval(timer); }; }, []);
  const questions = useMemo(() => (liveQuestions.length ? liveQuestions : questionBank).filter((question) => (!search || `${question.questionText} ${question.topic}`.toLowerCase().includes(search.toLowerCase())) && (subject === "All" || question.subject === subject)).slice(0, 6), [liveQuestions, search, subject]);
  return <section className="question-bank"><div className="section-title"><div><span className="eyebrow">Question bank</span><h2>Explore original practice</h2></div><span className="data-count">110 questions</span></div><div className="filter-bar"><label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a concept" /></label><label className="filter-select"><Filter size={16} /><select value={subject} onChange={(event) => setSubject(event.target.value)}><option>All</option>{supportedSubjects.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label></div><div className="question-preview-list">{questions.map((question) => <QuestionPreview key={question.id} question={question} bookmarked={bookmarks.includes(question.id)} onBookmark={() => toggleBookmark(question.id)} />)}</div>{!questions.length && <EmptyState title="No matching questions" text="Try a broader term or another subject." />}</section>;
}

function QuestionPreview({ question, bookmarked, onBookmark }: { question: Question; bookmarked: boolean; onBookmark: () => void }) { return <Card className="question-preview"><div><div className="preview-meta"><SourceBadge sourceType={question.sourceType} /><DifficultyBadge difficulty={question.difficulty} /><span>{question.subject} · {question.topic}</span></div><h3>{question.questionText}</h3><p>{question.questionType === "MULTIPLE" ? "Multiple correct answers" : "Single correct answer"}</p></div><BookmarkButton active={bookmarked} onClick={onBookmark} /></Card>; }

export function PyqPage() {
  const { start } = useExam();
  const navigate = useNavigate();
  const [year, setYear] = useState<number | "All">("All");
  const [papers, setPapers] = useState<Array<{ id: string; year: number; title: string; source: string; durationMinutes: number; totalQuestions: number | null; isPublished: boolean; playable?: boolean; status?: string; availabilityText?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/pyq")
      .then((response) => response.ok ? response.json() : { papers: [] })
      .then((payload) => setPapers(Array.isArray(payload.papers) ? payload.papers : []))
      .catch(() => setPapers([]))
      .finally(() => setLoading(false));
  }, []);

  const references = papers
    .filter((paper) => year === "All" || paper.year === year)
    .sort((a, b) => b.year - a.year);

  const beginExam = async (paper: { id: string; year: number; title: string; durationMinutes: number; totalQuestions: number | null; isPublished?: boolean; playable?: boolean }) => {
    if (!paper.totalQuestions || paper.playable === false) return;
    navigate(`/pyq/instructions/${paper.id}`);
  };

  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Verified-source policy</span>
          <h1>Previous-year paper references.</h1>
          <p>Authentic PYQ wording is only shown after it is checked against the official paper and key. This starter bank intentionally does not present recreated questions as PYQs.</p>
          <p className="paper-status">Official JECA 2025 mode: 100 exact questions, Q1–Q100, no randomization.</p>
        </div>
      </section>

      <Card className="notice-card">
        <BookOpen size={23} />
        <div>
          <b>Independent preparation resource</b>
          <p>JECA Prep Hub is not affiliated with or endorsed by WBJEEB. Every future PYQ import should retain its actual year, source, question number, and verification status.</p>
        </div>
      </Card>

      <div className="filter-bar pyq-filter">
        <label className="filter-select">
          <Filter size={16} />
          <select value={year} onChange={(event) => setYear(event.target.value === "All" ? "All" : Number(event.target.value))}>
            <option>All</option>
            {papers.map((paper) => <option key={paper.id} value={paper.year}>{paper.year}</option>)}
          </select>
          <ChevronDown size={15} />
        </label>
        <span className="data-count">{loading ? "Loading…" : `${references.length} official-paper references`}</span>
      </div>

      {references.length ? (
        <div className="paper-grid">
          {references.map((paper) => {
            const available = Boolean(paper.isPublished && paper.playable !== false);
            return (
              <Card className="paper-card" key={paper.id}>
                <div>
                  <span className="paper-year">{paper.year}</span>
                  <SourceBadge sourceType="PYQ" year={paper.year} />
                </div>
                <h2>{paper.title}</h2>
                <p>{paper.totalQuestions ? `${paper.totalQuestions} questions · ${paper.durationMinutes} min` : "Reference only — not reproduced in this demo until verified against the official paper and answer key."}</p>
                <footer>
                  <div className="paper-status">{available ? "Status: Available for Practice" : (paper.availabilityText ?? "Status: Available for Practice")}</div>
                  <div className="paper-actions">
                    {available ? (
                      <button className="button button-secondary" onClick={() => void beginExam(paper)}>Give Exam <ArrowRight size={15} /></button>
                    ) : (
                      <button className="button button-secondary" disabled aria-disabled="true">Unavailable</button>
                    )}
                    <Link to={`/pyq/instructions/${paper.id}`}>View details <ArrowRight size={15} /></Link>
                  </div>
                </footer>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="notice-card">
          <div>
            <b>Official JECA PYQs are available for practice</b>
            <p>Official question data is shown and playable in practice mode. Answers are explicitly labeled as AI-verified until an official answer key is later confirmed.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
