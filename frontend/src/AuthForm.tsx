import { useState } from "react";
import { useAuth } from "./AuthContext";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();

  function getPasswordError(value: string): string | null {
    if (value.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(value))
      return "Password must include an uppercase letter";
    if (!/[0-9]/.test(value)) return "Password must include a number";
    if (!/[^A-Za-z0-9]/.test(value))
      return "Password must include a special character";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "register") {
      const passwordError = getPasswordError(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ink)",
      }}
    >
      <div
        style={{
          width: 340,
          background: "var(--parchment)",
          color: "var(--charcoal)",
          padding: "32px 28px",
          borderRadius: 2,
          borderLeft: "4px solid var(--ember)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ fontSize: 28, marginBottom: 24 }}>
          {mode === "login" ? "Welcome back" : "Start a new campaign"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid #C9BFA6",
                borderRadius: 2,
                background: "#FFFDF8",
                fontFamily: "var(--font-ui)",
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid #C9BFA6",
                borderRadius: 2,
                background: "#FFFDF8",
                fontFamily: "var(--font-ui)",
              }}
              required
            />
            {mode === "register" && (
              <p style={{ fontSize: 12, color: "#6B6255", marginTop: 6 }}>
                At least 8 characters, with an uppercase letter, a number, and a
                special character.
              </p>
            )}
          </div>
          {error && (
            <p style={{ color: "var(--danger)", fontSize: 14 }}>{error}</p>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: 11,
              background: "var(--ember)",
              color: "var(--parchment)",
              border: "none",
              borderRadius: 2,
              fontWeight: 500,
              transition: "background var(--transition-fast)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--ember-bright)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--ember)")
            }
          >
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14 }}>
          {mode === "login" ? "Need an account?" : "Already have one?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{
              background: "none",
              border: "none",
              color: "var(--ember)",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            {mode === "login" ? "Create one" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
