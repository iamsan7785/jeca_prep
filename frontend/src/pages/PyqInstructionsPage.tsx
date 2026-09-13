import { AlertTriangle, ArrowRight, BookOpenCheck, CheckCircle2, Clock3, ShieldCheck, TimerReset } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { useAuth } from "../store/AuthContext";
import { useExam } from "../store/ExamContext";

type PaperRecord = {
  id: string;
  year: number;
  title: string;
  source: string;
  sourceUrl?: string | null;
  durationMinutes: number;
  totalQuestions: number | null;
  totalMarks: number | string | null;
  isPublished: boolean;
  playable?: boolean;
  status?: string;
  availabilityText?: string;
  config?: Record<string, unknown> | null;
};

export function PyqInstructionsPage() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { start } = useExam();
  const [paper, setPaper] = useState<PaperRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!paperId) return;
    void fetch(`/api/pyq/${paperId}`)
      .then((response) => response.ok ? response.json() : { paper: null })
      .then((payload) => setPaper(payload.paper ?? null))
      .catch(() => setPaper(null))
      .finally(() => setLoading(false));
  }, [paperId]);

  if (!paperId) return <Navigate to="/pyq" replace />;

  const beginExam = async () => {
    if (!paper || paper.playable === false || !paper.totalQuestions) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    setStarting(true);
    try {
      const exam = await start({
        testId: `pyq-${paper.id}`,
        testName: paper.title,
        count: paper.totalQuestions,
        durationMinutes: paper.durationMinutes || 120,
        type: "PYQ",
        paperId: paper.id,
      });
      navigate(`/mock-tests/${exam.testId}`);
    } catch (error) {
      console.error("Failed to start official PYQ:", error);
      setStarting(false);
    }
  };

  const positiveMarks = typeof paper?.config === "object" && paper.config && "positiveMarks" in paper.config ? Number((paper.config as Record<string, unknown>).positiveMarks ?? 0) : null;
  const negativeMarks = typeof paper?.config === "object" && paper.config && "negativeMarks" in paper.config ? Number((paper.config as Record<string, unknown>).negativeMarks ?? 0) : null;

  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Official PYQ instructions</span>
          <h1>{loading ? "Loading paper…" : paper?.title ?? "Official paper"}</h1>
          <p>Official papers are available for AI-verified practice mode. Answers are labeled as AI-verified and may differ from the eventual official key.</p>
          {paper?.title === "JECA 2025" && paper?.totalQuestions === 100 && (
            <p className="paper-status">Official JECA 2025 integrity check: exact 100-question paper, Q1–Q100, no randomization.</p>
          )}
        </div>
      </section>

      {!paper || paper.playable === false ? (
        <Card className="notice-card">
          <AlertTriangle size={22} />
          <div>
            <b>Paper unavailable</b>
            <p>This JECA paper is not available in the library.</p>
            <Link to="/pyq" className="button button-secondary">Back to PYQ library <ArrowRight size={15} /></Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="paper-grid">
            <Card className="paper-card">
              <div><span className="paper-year">{paper.year}</span></div>
              <h2>{paper.title}</h2>
              <p>{paper.totalQuestions} questions · {paper.durationMinutes} minutes</p>
              <footer>
                <div className="paper-status">Status: Available for Practice</div>
              </footer>
            </Card>
          </div>

          <Card className="notice-card">
            <BookOpenCheck size={22} />
            <div>
              <b>Exam instructions</b>
              <p>Complete the official PYQ in practice mode. Some answers are AI-verified and may differ from the official answer key. This result is for practice only.</p>
            </div>
          </Card>

          <div className="paper-grid">
            <Card>
              <div className="section-title"><div><span className="eyebrow">Paper details</span><h2>Official breakdown</h2></div></div>
              <div className="paper-status-list">
                <span><CheckCircle2 size={15} /> Exam: {paper.title}</span>
                <span><CheckCircle2 size={15} /> Year: {paper.year}</span>
                <span><CheckCircle2 size={15} /> Questions: {paper.totalQuestions ?? 0}</span>
                <span><CheckCircle2 size={15} /> Duration: {paper.durationMinutes} min</span>
                <span><CheckCircle2 size={15} /> Total marks: {paper.totalMarks ?? "Official paper config"}</span>
                <span><CheckCircle2 size={15} /> Positive marking: {positiveMarks !== null ? positiveMarks : "Official paper config"}</span>
                <span><CheckCircle2 size={15} /> Negative marking: {negativeMarks !== null ? negativeMarks : "Official paper config"}</span>
              </div>
            </Card>
            <Card>
              <div className="section-title"><div><span className="eyebrow">Rules</span><h2>Before you begin</h2></div></div>
              <div className="paper-status-list">
                <span><ShieldCheck size={15} /> One question at a time, in official order.</span>
                <span><Clock3 size={15} /> Timer is based on server timestamps and cannot be reset.</span>
                <span><TimerReset size={15} /> Refreshing the page restores your current answers and timer state.</span>
                <span><BookOpenCheck size={15} /> Only published official papers may be started.</span>
              </div>
            </Card>
          </div>

          <div className="exam-actions" style={{ justifyContent: "flex-start", marginTop: 16 }}>
            <Button onClick={() => void beginExam()} disabled={starting}>
              {starting ? "Preparing exam…" : "Start Exam"}
              <ArrowRight size={16} />
            </Button>
            <Link to="/pyq" className="button button-secondary">Back to PYQ Library</Link>
          </div>
        </>
      )}
    </div>
  );
}
