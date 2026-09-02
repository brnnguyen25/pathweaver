import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { registerUser, loginUser, type AuthUser } from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Restore session from localStorage on page load, so refreshing
  // the page doesn't log the user out.
  useEffect(() => {
    const storedToken = localStorage.getItem("pathweaver_token");
    const storedUser = localStorage.getItem("pathweaver_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  function persistSession(newUser: AuthUser, newToken: string) {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem("pathweaver_token", newToken);
    localStorage.setItem("pathweaver_user", JSON.stringify(newUser));
  }

  async function register(email: string, password: string) {
    const { user, token } = await registerUser(email, password);
    persistSession(user, token);
  }

  async function login(email: string, password: string) {
    const { user, token } = await loginUser(email, password);
    persistSession(user, token);
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("pathweaver_token");
    localStorage.removeItem("pathweaver_user");
  }

  return (
    <AuthContext.Provider value={{ user, token, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
