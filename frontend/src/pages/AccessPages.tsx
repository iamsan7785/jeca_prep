import { ArrowRight, BarChart3, BookOpenCheck, BrainCircuit, CheckCircle2, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { useAuth } from "../store/AuthContext";

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <main className="landing">
    <nav className="landing-nav"><Link className="brand brand-dark" to="/"><span className="brand-mark"><Sparkles size={18} /></span><span>JECA<br /><b>Prep Hub</b></span></Link><div><Link to="/login" className="text-link">Sign in</Link><Link to="/register" className="button button-primary">Start preparing <ArrowRight size={16} /></Link></div></nav>
    <section className="hero"><div className="hero-copy"><span className="eyebrow"><Sparkles size={14} /> Built for WB JECA aspirants</span><h1>Study with a plan.<br /><em>Perform with calm.</em></h1><p>Original concept practice, timed full-length mocks, and evidence-led review in one focused space.</p><div className="hero-actions"><Link to="/register" className="button button-primary">Create free learner space <ArrowRight size={16} /></Link><Link to="/login" className="button button-secondary">I already have an account</Link></div><div className="hero-note"><CheckCircle2 size={16} /> Independent preparation resource — not affiliated with or endorsed by WBJEEB.</div></div><Card className="hero-panel"><div className="mini-exam-top"><span>Full Length Mock 01</span><b><Clock3 size={15} /> 01:27:42</b></div><div className="mini-progress"><span>Question 37 of 100</span><div><i style={{ width: "37%" }} /></div></div><h3>Which statement about a database transaction is correct?</h3><div className="mini-options"><span>Atomicity prevents partial effects</span><span>Transactions cannot fail</span><span>Indexes replace constraints</span><span>Locks are never needed</span></div><div className="mini-footer"><span>Saved just now</span><b>37 / 100</b></div></Card></section>
    <section className="feature-strip"><article><BookOpenCheck /><div><b>110 original questions</b><span>Across the core JECA syllabus</span></div></article><article><BrainCircuit /><div><b>Adaptive practice</b><span>Focus by subject and difficulty</span></div></article><article><BarChart3 /><div><b>Useful review</b><span>See why each answer earned its score</span></div></article><article><ShieldCheck /><div><b>Source-aware PYQs</b><span>Verified references are clearly separated</span></div></article></section>
  </main>;
}

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { isAuthenticated, login, register, explore } = useAuth();
  const navigate = useNavigate(); const location = useLocation();
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    try { mode === "login" ? await login(String(form.get("email")), String(form.get("password"))) : await register(String(form.get("name")), String(form.get("email")), String(form.get("password"))); navigate((location.state as { from?: string } | null)?.from ?? "/dashboard"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to continue right now. Start the API or explore locally."); }
    finally { setLoading(false); }
  };
  return <main className="auth-page"><Link to="/" className="brand brand-dark auth-brand"><span className="brand-mark"><Sparkles size={18} /></span><span>JECA<br /><b>Prep Hub</b></span></Link><Card className="auth-card"><span className="eyebrow">{mode === "login" ? "Welcome back" : "Your focused workspace"}</span><h1>{mode === "login" ? "Pick up where you left off." : "Start practising with intent."}</h1><p>{mode === "login" ? "Sign in to continue your test sessions and performance history." : "Create an account to save attempts, bookmarks, and progress."}</p><form onSubmit={onSubmit} className="auth-form">{mode === "register" && <label>Name<input name="name" required minLength={2} placeholder="Your name" autoComplete="name" /></label>}<label>Email<input name="email" type="email" required placeholder="you@example.com" autoComplete="email" /></label><label>Password<input name="password" type="password" required minLength={8} placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>{error && <div className="form-error" role="alert">{error}</div>}<Button type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={16} /></Button></form><div className="auth-divider"><span>or</span></div><Button variant="secondary" onClick={() => { explore(); navigate("/dashboard"); }}>Explore with local demo data</Button><p className="auth-switch">{mode === "login" ? "New here?" : "Already have an account?"} <Link to={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Create an account" : "Sign in"}</Link></p></Card></main>;
}
