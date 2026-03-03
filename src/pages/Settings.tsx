import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Bot,
  ChevronRight,
  CreditCard,
  FileText,
  Link2,
  MessageSquare,
  ScrollText,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useNotifications } from "@/contexts/NotificationsContext";

export interface SettingsSectionLink {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
}

export const settingsSections: SettingsSectionLink[] = [
  {
    id: "host-details",
    title: "Host Details",
    description: "Profile shown to guests",
    path: "/settings/host-details",
    icon: User,
  },
  {
    id: "pms-sync",
    title: "PMS Sync",
    description: "Manage PMS provider connections",
    path: "/settings/pms-sync",
    icon: Link2,
  },
  {
    id: "payment-providers",
    title: "Payment Providers",
    description: "Connect payment gateways",
    path: "/settings/payment-providers",
    icon: CreditCard,
  },
  {
    id: "ai-providers",
    title: "AI Providers",
    description: "Configure AI model integrations",
    path: "/settings/ai-providers",
    icon: Bot,
  },
  {
    id: "knowledge-base",
    title: "Knowledge Base (RAG)",
    description: "Upload and index property documents",
    path: "/settings/knowledge-base",
    icon: FileText,
  },
  {
    id: "query-log",
    title: "Query Log",
    description: "Recent `search_knowledge` calls",
    path: "/settings/query-log",
    icon: MessageSquare,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Product updates and account alerts",
    path: "/settings/notifications",
    icon: Bell,
  },
  {
    id: "audit-log",
    title: "Audit Log",
    description: "API and integration activity history",
    path: "/settings/audit-log",
    icon: ScrollText,
  },
];

export default function SettingsHome() {
  const { hasUnread } = useNotifications();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">Open a settings page to manage a specific area</p>

      <div className="space-y-3">
        {settingsSections.map((section) => (
          <Link key={section.id} to={section.path} className="block">
            <Card className="rounded-2xl bg-card apple-shadow transition-colors hover:bg-secondary/40">
              <CardContent className="p-4 md:p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <section.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-card-foreground inline-flex items-center gap-2">
                    {section.title}
                    {section.id === "notifications" && hasUnread && (
                      <span
                        data-testid="settings-notifications-unread-dot"
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full bg-destructive"
                      />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
