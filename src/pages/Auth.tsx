import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Mail, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { hydrateSessionFromStorage } from "@/lib/auth";

const API_BASE = "https://api-fexi.onrender.com";
const GOOGLE_CLIENT_ID =
  "442287166168-hf8dlpddmqku2r9n482ssj98iihd2c7i.apps.googleusercontent.com";

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    const hydrateAuth = async () => {
      const result = await hydrateSessionFromStorage();
      if (!active) return;

      if (result.status === "ready") {
        navigate("/dashboard", { replace: true });
        return;
      }

      setCheckingSession(false);
    };

    hydrateAuth();

    return () => {
      active = false;
    };
  }, [navigate]);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking session...
        </div>
      </div>
    );
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1.0/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Failed to send magic link");
      }

      setSent(true);
      toast.success("Magic link sent! Check your email.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = "openid email profile";
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        className="text-center max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2, damping: 15 }}
        >
          <MessageSquare className="w-8 h-8 text-primary-foreground" />
        </motion.div>

        {/*<h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
          monobook.ing
        </h1>*/}
        <div className="items-center justify-center">
          <img src="/logo.png" className="w-60 mx-auto" />
        </div>
        <p className="text-muted-foreground mb-10">
          Sign in to manage your properties
        </p>

        {sent ? (
          <motion.div
            className="rounded-2xl bg-card apple-shadow p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-card-foreground mb-2">
              Check your email
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              We sent a magic link to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <button
              className="text-sm text-primary hover:underline"
              onClick={() => setSent(false)}
            >
              Use a different email
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-card apple-shadow text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
              <motion.button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {loading ? "Sending..." : "Login via Magic Link"}
              </motion.button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-card apple-shadow text-card-foreground font-semibold text-sm min-h-[44px]"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Login with Google
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
