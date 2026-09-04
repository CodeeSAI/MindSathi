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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F4F7F8",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#FFFFFF",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
border: "1px solid rgba(79,175,161,0.2)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
         <img
  src="/logo.png"
  alt="MindSathi"
  style={{
    width: "120px",
height: "120px",
    objectFit: "contain",
    margin: "0 auto 12px",
    display: "block",
  }}
/>
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              color: "#31527A",
            }}
          >
            MindSathi
          </h1>

          <p
            style={{
              marginTop: "10px",
              marginBottom: 0,
              color: "#B8D8D5",
              fontSize: "16px",
            }}
          >
            Welcome back
          </p>
        </div>

        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: 600,
            color: "#FFFFFF",
          }}
        >
          Email
        </label>

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px",
            marginBottom: "20px",
            border: "1px solid #3F7772",
            borderRadius: "12px",
            fontSize: "16px",
            outline: "none",
          }}
        />

        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: 600,
            color: "#FFFFFF",
          }}
        >
          Password
        </label>

        <input
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
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px",
            marginBottom: "18px",
            border: "1px solid #3F7772",
            borderRadius: "12px",
            fontSize: "16px",
            outline: "none",
          }}
        />

        {error && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px",
              borderRadius: "10px",
              background: "#fee2e2",
              color: "#b91c1c",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px",
            border: "none",
            borderRadius: "12px",
            background: "#4FAFA1",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p
          style={{
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "13px",
            marginTop: "24px",
            marginBottom: 0,
          }}
        >
          Secure access to your MindSathi account
        </p>
      </div>
    </div>
  );
}