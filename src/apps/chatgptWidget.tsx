import { createRoot } from "react-dom/client";

import { ChatGPTBookingWidget } from "@/components/apps/ChatGPTBookingWidget";
import "@/index.css";

const container = document.getElementById("monobook-widget-root");

if (container) {
  createRoot(container).render(<ChatGPTBookingWidget />);
}

