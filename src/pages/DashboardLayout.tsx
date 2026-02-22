import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, CalendarDays, Settings, MessageSquare } from "lucide-react";

const navItems = [
  { id: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "/inventory", label: "Inventory", icon: CalendarDays },
  { id: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = navItems.find((item) => item.id === location.pathname)?.id || "/dashboard";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col glass border-r border-border p-4 fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-sm tracking-tight">StayAI</h2>
            <p className="text-[10px] text-muted-foreground">Hotel Intelligence</p>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(item.id)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </motion.button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-border z-30">
        <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 min-w-[64px] min-h-[44px] ${
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              }`}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.id)}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </nav>
    </div>
  );
}
