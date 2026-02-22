import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  API_BASE,
  clearAuthStorage,
  fetchMeWithRetry,
  isAuthInvalidError,
  saveAccessToken,
  saveUserMe,
} from "@/lib/auth";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Google sign-in was cancelled or failed.");
      return;
    }

    if (!code) {
      setError("No authorization code received.");
      return;
    }

    const exchangeCode = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        const res = await fetch(`${API_BASE}/v1.0/signin/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, redirect_uri: redirectUri }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.detail || "Google sign-in failed");
        }

        const data = await res.json();
        const accessToken = data?.access_token;

        if (!accessToken || typeof accessToken !== "string") {
          throw new Error("Google sign-in did not return a valid access token");
        }

        saveAccessToken(accessToken);
        const me = await fetchMeWithRetry(accessToken, 3, 400);
        saveUserMe(me);

        toast.success("Signed in successfully!");
        navigate("/dashboard", { replace: true });
      } catch (err) {
        if (isAuthInvalidError(err)) {
          clearAuthStorage();
        }

        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

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

        {error ? (
          <div className="rounded-2xl bg-card apple-shadow p-6">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-card-foreground mb-2">
              Sign-in failed
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <motion.button
              onClick={() => navigate("/auth", { replace: true })}
              className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
              whileTap={{ scale: 0.97 }}
            >
              Try again
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">
              Completing sign-in...
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
