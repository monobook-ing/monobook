import { Navigate, Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AuditLog } from "@/components/dashboard/AuditLog";
import { NotificationsSettings } from "@/components/dashboard/NotificationsSettings";
import {
  MCPIntegrationSettings,
  type SettingsSection as MCPSettingsSection,
} from "@/components/dashboard/MCPIntegrationSettings";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationsContext";
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
  const { hasUnread } = useNotifications();
  const section = settingsSections.find((item) => item.id === sectionId);

  if (!sectionId || !section) {
    return <Navigate to="/settings" replace />;
  }

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <Link
        to="/settings"
        className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground md:hidden"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        All settings
      </Link>

      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">{section.title}</h1>
      <p className="text-sm text-muted-foreground mb-5">{section.description}</p>

      <div className="mb-6 w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden hide-scrollbar">
        <div className="inline-flex w-max items-center gap-1 rounded-xl bg-secondary p-1">
          {settingsSections.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "px-3 py-2 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0",
                item.id === sectionId
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="inline-flex items-center gap-2">
                {item.title}
                {item.id === "notifications" && hasUnread && (
                  <span
                    data-testid="settings-section-notifications-unread-dot"
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-destructive"
                  />
                )}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {sectionId === "audit-log" ? (
        <AuditLog showHeader={false} />
      ) : sectionId === "notifications" ? (
        <NotificationsSettings showHeader={false} />
      ) : (
        <MCPIntegrationSettings section={mcpSectionById[sectionId]} showHeader={false} />
      )}
    </div>
  );
}
