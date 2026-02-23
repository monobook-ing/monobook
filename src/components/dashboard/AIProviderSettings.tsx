import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bot, Eye, EyeOff, Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperty } from "@/contexts/PropertyContext";
import { API_BASE, readAccessToken } from "@/lib/auth";

interface AIConnection {
  id: string;
  property_id: string;
  provider: string;
  enabled: boolean;
  model_id: string | null;
  has_api_key: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const AI_PROVIDERS = [
  {
    provider: "openai",
    label: "OpenAI",
    description: "GPT-4o, GPT-4o Mini, Embeddings",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o Mini (Recommended)" },
      { id: "gpt-4o", label: "GPT-4o" },
    ],
    available: true,
  },
  {
    provider: "claude",
    label: "Claude",
    description: "Anthropic's Claude models",
    models: [],
    available: false,
  },
  {
    provider: "google",
    label: "Google AI",
    description: "Gemini models via AI Studio",
    models: [],
    available: false,
  },
];

export function AIProviderSettings() {
  const { selectedPropertyId } = useProperty();
  const [connections, setConnections] = useState<AIConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    if (selectedPropertyId === "all") return;
    setIsLoading(true);
    setError(null);
    try {
      const token = readAccessToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(
        `${API_BASE}/v1.0/properties/${selectedPropertyId}/ai-connections`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConnections(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    if (selectedPropertyId !== "all") {
      loadConnections();
    }
  }, [selectedPropertyId, loadConnections]);

  return (
    <div className="rounded-2xl bg-card apple-shadow mb-6">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-card-foreground">AI Providers</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Connect AI models for the chat concierge and semantic search
        </p>
      </div>

      {selectedPropertyId === "all" && (
        <div className="p-5">
          <Card className="rounded-xl border-dashed">
            <CardContent className="p-6 text-center">
              <h3 className="text-base font-semibold text-foreground">Select a property</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a property to manage AI provider connections.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedPropertyId !== "all" && isLoading && (
        <div className="px-5 pb-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-9 w-16 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {selectedPropertyId !== "all" && !isLoading && error && (
        <div className="p-5">
          <Card className="rounded-xl border-destructive/30">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedPropertyId !== "all" && !isLoading && !error && (
        <div className="px-5 divide-y divide-border">
          {AI_PROVIDERS.map((provider) => {
            const connection = connections.find(
              (c) => c.provider === provider.provider,
            );
            return (
              <AIProviderItem
                key={provider.provider}
                provider={provider}
                connection={connection}
                propertyId={selectedPropertyId}
                onUpdate={loadConnections}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface AIProviderItemProps {
  provider: (typeof AI_PROVIDERS)[number];
  connection?: AIConnection;
  propertyId: string;
  onUpdate: () => void;
}

function AIProviderItem({
  provider,
  connection,
  propertyId,
  onUpdate,
}: AIProviderItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    connection?.model_id || provider.models[0]?.id || "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const isEnabled = connection?.enabled ?? false;
  const hasKey = connection?.has_api_key ?? false;

  const handleSave = async (enabled: boolean) => {
    setIsSaving(true);
    setTestResult(null);
    try {
      const token = readAccessToken();
      const body: Record<string, unknown> = {
        enabled,
        model_id: selectedModel || null,
      };
      if (apiKey) {
        body.api_key = apiKey;
      }
      const res = await fetch(
        `${API_BASE}/v1.0/properties/${propertyId}/ai-connections/${provider.provider}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(
        `${provider.label} ${enabled ? "enabled" : "disabled"}`,
      );
      setApiKey("");
      onUpdate();
    } catch (e) {
      toast.error("Failed to save AI connection");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const token = readAccessToken();
      const res = await fetch(
        `${API_BASE}/v1.0/properties/${propertyId}/ai-connections/${provider.provider}/test`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: "Test request failed" });
    } finally {
      setIsTesting(false);
    }
  };

  if (!provider.available) {
    return (
      <div className="flex items-center justify-between py-4 opacity-50">
        <div>
          <p className="text-sm font-medium text-card-foreground">
            {provider.label}
          </p>
          <p className="text-xs text-muted-foreground">{provider.description}</p>
        </div>
        <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-secondary">
          Coming soon
        </span>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        <div
          className="flex-1 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-card-foreground">
              {provider.label}
            </p>
            {isEnabled && hasKey && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{provider.description}</p>
        </div>

        <motion.button
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors min-w-[48px] ${
            isEnabled ? "bg-primary" : "bg-input"
          }`}
          onClick={() => handleSave(!isEnabled)}
          disabled={isSaving || (!hasKey && !apiKey && !isEnabled)}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span
            className="inline-block h-5 w-5 rounded-full bg-background shadow-sm"
            animate={{ x: isEnabled ? 22 : 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </motion.button>
      </div>

      {/* Expanded settings */}
      {isExpanded && (
        <motion.div
          className="mt-3 space-y-3"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* API Key */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              API Key {hasKey && "(saved)"}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasKey ? "••••••••••••••••" : "sk-..."}
                  className="w-full bg-secondary rounded-xl px-3 py-2 text-sm text-foreground pr-10 min-h-[44px]"
                />
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
              {apiKey && (
                <motion.button
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium min-h-[44px]"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </motion.button>
              )}
            </div>
          </div>

          {/* Model Selector */}
          {provider.models.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-secondary rounded-xl px-3 py-2 text-sm text-foreground min-h-[44px]"
              >
                {provider.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Test Connection */}
          {hasKey && (
            <div className="flex items-center gap-2">
              <motion.button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm text-foreground min-h-[36px]"
                whileTap={{ scale: 0.95 }}
                onClick={handleTest}
                disabled={isTesting}
              >
                {isTesting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                Test Connection
              </motion.button>
              {testResult && (
                <span
                  className={`flex items-center gap-1 text-xs ${
                    testResult.success
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-500"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {testResult.message}
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
