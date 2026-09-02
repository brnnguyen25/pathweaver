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
      style={{ maxWidth: 320, margin: "80px auto", fontFamily: "sans-serif" }}
    >
      <h2>{mode === "login" ? "Log In" : "Register"}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          />
          {mode === "register" && (
            <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              At least 8 characters, with an uppercase letter, a number, and a
              special character.
            </p>
          )}
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ width: "100%", padding: 8 }}>
          {mode === "login" ? "Log In" : "Register"}
        </button>
      </form>
      <p style={{ marginTop: 12 }}>
        {mode === "login" ? "Need an account?" : "Already have an account?"}{" "}
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          style={{
            background: "none",
            border: "none",
            color: "blue",
            cursor: "pointer",
          }}
        >
          {mode === "login" ? "Register" : "Log In"}
        </button>
      </p>
    </div>
  );
}
