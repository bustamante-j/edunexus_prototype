import { useEffect, useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Brand } from "../components/brand";
import { Button } from "../components/ui";
import { useAppStore } from "../store/use-app-store";

const roleNames = {
  school_head: "School Head",
  admin_officer: "Administrative Officer",
  teacher: "Class Adviser",
};

export function LoginPage() {
  const navigate = useNavigate();
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const login = useAppStore((state) => state.login);
  const [email, setEmail] = useState(users[0].email);
  const [password, setPassword] = useState(users[0].password);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUserId) navigate("/", { replace: true });
  }, [currentUserId, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    const success = login(email, password);
    setLoading(false);
    if (success) navigate("/", { replace: true });
    else setError("The email or password does not match an authorized account.");
  }

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Balili Elementary School">
        <div className="login-visual__overlay" />
        <div className="login-visual__content">
          <div className="login-visual__school">Balili Elementary School</div>
          <h1>One learner record.<br />Every school form.</h1>
          <p>Attendance, academic records, promotion, and required school outputs in one connected workspace.</p>
          <div className="login-visual__facts">
            <span><strong>897</strong> enrolled learners</span>
            <span><strong>30</strong> class sections</span>
            <span><strong>SY 2026-2027</strong> active records</span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel__inner">
          <Brand />
          <div className="login-heading">
            <span>Authorized school personnel</span>
            <h2>Sign in to EduNexus</h2>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label>
              <span>Email address</span>
              <div className="login-input">
                <Mail size={18} />
                <input
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@balili.edu.ph"
                  type="email"
                  required
                />
              </div>
            </label>
            <label>
              <span>Password</span>
              <div className="login-input">
                <LockKeyhole size={18} />
                <input
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  required
                />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error ? <div className="login-error">{error}</div> : null}
            <Button className="login-submit" disabled={loading} type="submit">
              {loading ? <span className="button-spinner" /> : <>Continue <ArrowRight size={18} /></>}
            </Button>
          </form>

          <div className="presentation-access">
            <div className="presentation-access__heading">
              <span>Presentation access</span>
              <small>Select an account to fill the form</small>
            </div>
            <div className="presentation-access__list">
              {users.map((user) => {
                const selected = user.email === email;
                return (
                  <button
                    type="button"
                    className={selected ? "is-selected" : undefined}
                    key={user.id}
                    onClick={() => {
                      setEmail(user.email);
                      setPassword(user.password);
                      setError("");
                    }}
                  >
                    <span className="presentation-access__avatar">{user.initials}</span>
                    <span><strong>{roleNames[user.role]}</strong><small>{user.email}</small></span>
                    {selected ? <Check size={17} /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="login-disclaimer">Prototype environment. Records shown are fictional and stored only in this browser.</p>
        </div>
      </section>
    </main>
  );
}

