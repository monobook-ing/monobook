import { Navigate, Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AuditLog } from "@/components/dashboard/AuditLog";
import {
  MCPIntegrationSettings,
  type SettingsSection as MCPSettingsSection,
} from "@/components/dashboard/MCPIntegrationSettings";
import { cn } from "@/lib/utils";
import { settingsSections } from "./Settings";

const mcpSectionById: Record<string, MCPSettingsSection> = {
  "host-details": "host-details",
  "pms-sync": "pms-sync",
  "payment-providers": "payment-providers",
  "ai-providers": "ai-providers",
  "knowledge-base": "knowledge-base",
  "query-log": "query-log",
};

export default function SettingsSectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const section = settingsSections.find((item) => item.id === sectionId);

  if (!sectionId || !section) {
    return <Navigate to="/settings" replace />;
  }

  return (
    <div>
      <Link
        to="/settings"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        All settings
      </Link>

      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">{section.title}</h1>
      <p className="text-sm text-muted-foreground mb-5">{section.description}</p>

      <div className="mb-6 overflow-x-auto">
        <div className="inline-flex items-center gap-1 rounded-xl bg-secondary p-1 min-w-full md:min-w-0">
          {settingsSections.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "px-3 py-2 text-xs rounded-lg transition-colors whitespace-nowrap",
                item.id === sectionId
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>

      {sectionId === "audit-log" ? (
        <AuditLog showHeader={false} />
      ) : (
        <MCPIntegrationSettings section={mcpSectionById[sectionId]} showHeader={false} />
      )}
    </div>
  );
}
