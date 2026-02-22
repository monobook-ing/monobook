import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        className="text-center max-w-md"
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

        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">monobook.ing</h1>
        <p className="text-muted-foreground mb-10">
          AI-powered hotel booking platform with agentic checkout
        </p>

        <div className="flex flex-col gap-3">
          <motion.button
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-card apple-shadow min-h-[44px]"
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => navigate("/widget")}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-card-foreground text-sm">Guest Widget</p>
                <p className="text-xs text-muted-foreground">Browse & book properties</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>

          <motion.button
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-card apple-shadow min-h-[44px]"
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => navigate("/dashboard")}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-success" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-card-foreground text-sm">Hotelier Dashboard</p>
                <p className="text-xs text-muted-foreground">Manage your AI agent</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
