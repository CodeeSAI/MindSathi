import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

type Role = "patient" | "caretaker";

interface LoginPageProps {
  onLogin: (role: Role) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const userRef = doc(db, "users", credential.user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        setError("Your account is missing a role.");
        return;
      }

      const role = userSnapshot.data().role;

      if (role !== "patient" && role !== "caretaker") {
        setError("Invalid account role.");
        return;
      }

      onLogin(role);
    } catch (error: unknown) {
      console.error("Login error:", error);

      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : "";

      if (code === "auth/invalid-credential") {
        setError("Incorrect email or password.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .ms-login {
          --ms-cream: #FFFDF1;
          --ms-green: #59C749;
          --ms-black: #000000;
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 36px;
          box-sizing: border-box;
          background: var(--ms-cream);
          color: var(--ms-black);
          font-family: "Trebuchet MS", "Segoe UI", sans-serif;
        }
        .ms-login *, .ms-login *::before, .ms-login *::after { box-sizing: border-box; }
        .ms-login__layout {
          width: min(1120px, 100%);
          min-height: 650px;
          display: grid;
          grid-template-columns: 1.02fr 0.98fr;
          overflow: hidden;
          border: 2px solid var(--ms-black);
          border-radius: 28px;
          background: var(--ms-cream);
          box-shadow: 10px 10px 0 var(--ms-black);
          animation: ms-rise 700ms cubic-bezier(.2,.75,.25,1) both;
        }
        .ms-login__brand {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
          padding: 38px;
          overflow: hidden;
          background: var(--ms-green);
          border-right: 2px solid var(--ms-black);
        }
        .ms-login__brand::before, .ms-login__brand::after {
          position: absolute;
          content: "";
          border: 2px solid var(--ms-black);
          pointer-events: none;
        }
        .ms-login__brand::before {
          width: 250px;
          height: 250px;
          right: -112px;
          top: 54px;
          border-radius: 50%;
          border-width: 3px;
        }
        .ms-login__brand::after {
          width: 118px;
          height: 118px;
          right: 34px;
          bottom: 96px;
          top: auto;
          border-radius: 30px;
          transform: rotate(14deg);
        }
        .ms-login__edition, .ms-login__footer {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        .ms-login__edition {
          width: fit-content;
          padding: 10px 14px;
          border: 1.5px solid var(--ms-black);
          border-radius: 999px;
          background: var(--ms-cream);
        }
        .ms-login__edition::before {
          width: 9px;
          height: 9px;
          content: "";
          background: var(--ms-black);
          border-radius: 50%;
        }
        .ms-login__brand-content {
          position: relative;
          z-index: 1;
          width: 100%;
          margin: auto 0;
        }
        .ms-login__logo-wrap {
          position: relative;
          isolation: isolate;
          width: clamp(230px, 64%, 300px);
          max-width: 100%;
          margin-bottom: 14px;
          overflow: hidden;
          padding: 10px;
          border: 2px solid var(--ms-black);
          border-radius: 28px 36px 28px 36px;
          background: var(--ms-cream);
          box-shadow: 4px 4px 0 var(--ms-black);
        }
        .ms-login__logo-wrap::after {
          position: absolute;
          inset: 0;
          content: "";
          pointer-events: none;
          background: linear-gradient(
            110deg,
            transparent 38%,
            rgba(255, 253, 241, .55) 49%,
            rgba(214, 255, 207, .32) 53%,
            transparent 63%
          );
          background-size: 240% 100%;
          background-position: 110% 0;
          opacity: 0;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask-composite: exclude;
        }
        @supports ((mask-composite: exclude) or (-webkit-mask-composite: xor)) {
          .ms-login__logo-wrap::after { animation: ms-logo-shine 10s ease-in-out infinite; }
        }
        .ms-login__logo {
          display: block;
          width: 100%;
          height: auto;
          border-radius: 16px;
          object-fit: contain;
        }
        .ms-login__brand-copy { position: relative; z-index: 1; min-width: 0; }
        .ms-login__title {
          max-width: 100%;
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(34px, 6vw, 70px);
          font-weight: 700;
          line-height: .98;
          white-space: nowrap;
        }
        .ms-login__tagline {
          max-width: 300px;
          margin: 14px 0 0;
          font-size: 17px;
          font-weight: 600;
          line-height: 1.5;
        }
        .ms-login__footer { justify-content: space-between; border-top: 2px solid var(--ms-black); padding-top: 16px; }
        .ms-login__form-panel {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
          padding: clamp(34px, 6vw, 72px);
        }
        .ms-login__eyebrow {
          margin: 0 0 13px;
          color: #267D1B;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        .ms-login__welcome {
          margin: 0 0 10px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(34px, 4vw, 48px);
          line-height: 1.04;
        }
        .ms-login__intro { margin: 0 0 34px; color: #333; font-size: 15px; line-height: 1.55; }
        .ms-login__field { margin-bottom: 22px; }
        .ms-login__label {
          display: block;
          margin: 0 0 9px 4px;
          color: var(--ms-black);
          font-size: 13px;
          font-weight: 800;
        }
        .ms-login__input {
          width: 100%;
          min-height: 56px;
          padding: 0 21px;
          border: 1.5px solid var(--ms-black);
          border-radius: 999px;
          outline: none;
          background: transparent;
          color: var(--ms-black);
          font: inherit;
          font-size: 15px;
          transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease, transform 180ms ease;
        }
        .ms-login__input::placeholder { color: #777; }
        .ms-login__input:focus {
          border-color: #267D1B;
          background: #fffef8;
          box-shadow: 0 0 0 4px rgba(89, 199, 73, .22);
          transform: translateY(-1px);
        }
        .ms-login__error {
          margin: 0 0 18px;
          padding: 13px 17px;
          border: 1.5px solid var(--ms-black);
          border-radius: 16px;
          background: #ffe3dc;
          color: #721c11;
          font-size: 14px;
          line-height: 1.45;
        }
        .ms-login__submit {
          width: 100%;
          min-height: 58px;
          padding: 0 24px;
          border: 2px solid var(--ms-black);
          border-radius: 999px;
          background: var(--ms-green);
          color: var(--ms-black);
          font: inherit;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }
        .ms-login__submit:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 5px 0 var(--ms-black); background: #68d458; }
        .ms-login__submit:active:not(:disabled) { transform: translateY(1px); box-shadow: none; }
        .ms-login__submit:focus-visible { outline: 3px solid var(--ms-black); outline-offset: 4px; }
        .ms-login__submit:disabled { cursor: not-allowed; opacity: .65; }
        .ms-login__secure {
          margin: 25px 0 0;
          padding-top: 18px;
          border-top: 1.5px solid var(--ms-black);
          color: #393939;
          font-size: 12px;
          line-height: 1.5;
        }
        @keyframes ms-rise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ms-logo-shine {
          0%, 58%, 100% { background-position: 110% 0; opacity: 0; }
          60% { opacity: .24; }
          82% { background-position: -15% 0; opacity: .24; }
          88% { opacity: 0; }
        }
        @media (max-width: 760px) {
          .ms-login {
            display: block;
            min-height: 100vh;
            min-height: 100dvh;
            padding: 0;
            overflow-x: hidden;
          }
          .ms-login__layout {
            display: flex;
            flex-direction: column;
            width: 100%;
            min-height: 100vh;
            min-height: 100dvh;
            overflow: visible;
            border: 0;
            border-radius: 0;
            box-shadow: none;
            animation-duration: 500ms;
          }
          .ms-login__brand {
            min-height: 0;
            justify-content: center;
            padding: 20px 22px;
            border: 0;
            border-bottom: 2px solid var(--ms-black);
          }
          .ms-login__brand::before { width: 150px; height: 150px; top: -70px; right: -46px; }
          .ms-login__brand::after { width: 62px; height: 62px; top: auto; right: 24px; bottom: -30px; border-radius: 19px; }
          .ms-login__edition, .ms-login__footer { display: none; }
          .ms-login__brand-content {
            display: grid;
            grid-template-columns: clamp(104px, 29vw, 128px) minmax(0, 1fr);
            align-items: center;
            gap: clamp(14px, 4vw, 22px);
            margin: 0;
          }
          .ms-login__logo-wrap {
            width: 100%;
            margin: 0;
            padding: 5px;
            border-width: 1.5px;
            border-radius: 20px 26px 20px 26px;
            box-shadow: 3px 3px 0 var(--ms-black);
          }
          .ms-login__logo { border-radius: 13px; }
          .ms-login__title {
            font-size: clamp(24px, 7.6vw, 36px);
            line-height: 1.05;
            white-space: normal;
            overflow-wrap: anywhere;
          }
          .ms-login__tagline { margin-top: 8px; font-size: 14px; line-height: 1.4; }
          .ms-login__form-panel {
            flex: 1;
            width: min(100%, 520px);
            margin: 0 auto;
            justify-content: flex-start;
            padding: 27px 24px 34px;
            scroll-padding-block: 24px;
          }
          .ms-login__eyebrow { margin-bottom: 8px; font-size: 12px; }
          .ms-login__welcome { margin-bottom: 8px; font-size: 36px; }
          .ms-login__intro { margin-bottom: 23px; font-size: 16px; }
          .ms-login__field { margin-bottom: 18px; }
          .ms-login__label { margin-bottom: 8px; font-size: 14px; }
          .ms-login__input { min-height: 58px; padding: 0 19px; font-size: 16px; }
          .ms-login__submit { min-height: 60px; font-size: 16px; }
          .ms-login__secure { margin-top: 20px; padding-top: 14px; font-size: 13px; }
        }
        @media (max-width: 400px) {
          .ms-login__brand { padding: 17px 18px; }
          .ms-login__brand-content { grid-template-columns: 96px minmax(0, 1fr); gap: 14px; }
          .ms-login__title { font-size: clamp(23px, 7.2vw, 29px); }
          .ms-login__tagline { font-size: 13px; }
          .ms-login__form-panel { padding: 24px 20px 28px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ms-login__layout { animation: none; }
          .ms-login__input, .ms-login__submit { transition: none; }
          .ms-login__logo-wrap::after { animation: none; opacity: 0; }
        }
      `}</style>
      <main className="ms-login">
        <div className="ms-login__layout">
          <section className="ms-login__brand" aria-label="MindSathi">
            <div className="ms-login__edition">Mindful care, together</div>
            <div className="ms-login__brand-content">
              <div className="ms-login__logo-wrap">
                <img className="ms-login__logo" src="/logo.png" alt="MindSathi" />
              </div>
              <div className="ms-login__brand-copy">
                <h1 className="ms-login__title">MindSathi<span aria-hidden="true">.</span></h1>
                <p className="ms-login__tagline">A little more connection, every day.</p>
              </div>
            </div>
            <div className="ms-login__footer"><span>Care with clarity</span><span>01 / 02</span></div>
          </section>

          <section className="ms-login__form-panel" aria-labelledby="ms-login-heading">
            <p className="ms-login__eyebrow">Your space is ready</p>
            <h2 className="ms-login__welcome" id="ms-login-heading">Welcome back</h2>
            <p className="ms-login__intro">Sign in to continue to your MindSathi account.</p>

            <label className="ms-login__label" htmlFor="ms-login-email">Email</label>
            <div className="ms-login__field">
              <input
                className="ms-login__input"
                id="ms-login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>

            <label className="ms-login__label" htmlFor="ms-login-password">Password</label>
            <div className="ms-login__field">
              <input
                className="ms-login__input"
                id="ms-login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleLogin();
                  }
                }}
              />
            </div>

            {error && <div className="ms-login__error" role="alert">{error}</div>}

            <button
              className="ms-login__submit"
              type="button"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            <p className="ms-login__secure">Secure access to your MindSathi account</p>
          </section>
        </div>
      </main>
    </>
  );
}