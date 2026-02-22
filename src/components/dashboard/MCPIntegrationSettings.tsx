import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Trash2, FileText, Wifi, Link2 } from "lucide-react";
import { mockUploadedFiles } from "@/data/mockData";

interface ToggleItemProps {
  label: string;
  description: string;
  defaultOn?: boolean;
}

function ToggleItem({ label, description, defaultOn = false }: ToggleItemProps) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3.5">
      <div>
        <p className="text-sm font-medium text-card-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <motion.button
        className="relative w-[62px] h-[36px] rounded-full flex items-center min-w-[62px] min-h-[44px] cursor-pointer"
        onClick={() => setOn(!on)}
        whileTap={{ scale: 0.92 }}
      >
        {/* Outer border ring (iOS 26 Liquid Glass) */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: on
              ? "inset 0 0 0 2.5px hsl(142 50% 42%)"
              : "inset 0 0 0 2px hsl(0 0% 0% / 0.08)",
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />
        {/* Track fill */}
        <motion.div
          className="absolute rounded-full"
          style={{ inset: "3px" }}
          animate={{
            backgroundColor: on ? "hsl(142 55% 55%)" : "hsl(0 0% 0% / 0.04)",
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />
        {/* Thumb */}
        <motion.div
          className="absolute rounded-full bg-white"
          style={{
            width: "26px",
            height: "26px",
            top: "5px",
            boxShadow: "0 1px 4px hsl(0 0% 0% / 0.18), 0 0 0 0.5px hsl(0 0% 0% / 0.04)",
          }}
          animate={{ left: on ? "31px" : "5px" }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      </motion.button>
    </div>
  );
}

export function MCPIntegrationSettings() {
  const [files, setFiles] = useState(mockUploadedFiles);

  const removeFile = (id: string) => {
    setFiles((f) => f.filter((file) => file.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">AI agent integrations & configuration</p>

      {/* PMS Sync */}
      <div className="rounded-2xl bg-card apple-shadow mb-6">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-card-foreground">PMS Sync</h2>
          </div>
        </div>
        <div className="px-5 divide-y divide-border">
          <ToggleItem label="Mews" description="Sync rooms & rates automatically" defaultOn />
          <ToggleItem label="Cloudbeds" description="Two-way calendar sync" />
          <ToggleItem label="Servio" description="POS & reservation sync" />
        </div>
      </div>

      {/* Stripe */}
      <div className="rounded-2xl bg-card apple-shadow mb-6 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wifi className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-card-foreground">Stripe Account</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your Stripe account to process payments as Merchant of Record.
        </p>
        <motion.button
          className="px-6 py-2.5 rounded-full bg-foreground text-background font-medium text-sm min-h-[44px]"
          whileTap={{ scale: 0.95 }}
        >
          Connect Stripe
        </motion.button>
      </div>

      {/* Knowledge Base */}
      <div className="rounded-2xl bg-card apple-shadow mb-6">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-card-foreground">Knowledge Base (RAG)</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Upload hotel manuals, WiFi passwords, and policies
          </p>
        </div>

        {/* Upload Zone */}
        <div className="p-5">
          <motion.div
            className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center cursor-pointer hover:border-primary/30 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-card-foreground">Drop files here</p>
            <p className="text-xs text-muted-foreground">PDF, DOCX up to 10MB</p>
          </motion.div>
        </div>

        {/* File List */}
        <div className="px-5 pb-3 divide-y divide-border">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.size} · {file.uploadedAt}</p>
                </div>
              </div>
              <motion.button
                className="w-9 h-9 rounded-full flex items-center justify-center min-w-[44px] min-h-[44px] text-destructive hover:bg-destructive/10 transition-colors"
                whileTap={{ scale: 0.9 }}
                onClick={() => removeFile(file.id)}
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
