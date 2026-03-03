import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const tabs = [
  { label: "All Services", path: "/services" },
  { label: "Categories", path: "/services/categories" },
  { label: "Partners", path: "/services/partners" },
  { label: "Analytics", path: "/services/analytics" },
];

export default function ServicesLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = location.pathname.split("/").filter(Boolean);
  const staticSections = new Set(["categories", "partners", "analytics", "new"]);
  const isRecordPage =
    pathParts[0] === "services" &&
    pathParts.length >= 2 &&
    !staticSections.has(pathParts[1]);
  const isSubPage = location.pathname.includes("/services/new") || isRecordPage;

  const activeTab =
    tabs.find((t) => t.path === location.pathname)?.path ?? "/services";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {!isSubPage && (
        <>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Services & Add-ons
            </h1>
            <Button
              className="rounded-xl gap-1.5"
              size="sm"
              onClick={() => navigate("/services/new")}
            >
              <Plus className="w-4 h-4" />
              Create Service
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Manage upsells, experiences, and partner offerings
          </p>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-muted/60 w-fit mb-6">
            {tabs.map((t) => (
              <button
                key={t.path}
                onClick={() => navigate(t.path)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === t.path
                    ? "bg-card text-foreground apple-shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      <Outlet />
    </motion.div>
  );
}
