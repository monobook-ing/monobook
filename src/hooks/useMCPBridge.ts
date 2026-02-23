import { useCallback, useEffect, useRef, useState } from "react";

interface MCPMessage {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
  id?: string | number;
}

interface MCPBridgeState {
  isConnected: boolean;
  lastMessage: MCPMessage | null;
}

declare global {
  interface Window {
    openai?: {
      callTool?: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
      setModelContext?: (context: Record<string, unknown>) => Promise<unknown>;
      updateModelContext?: (context: Record<string, unknown>) => Promise<unknown>;
    };
  }
}

export function useMCPBridge() {
  const [state, setState] = useState<MCPBridgeState>({
    isConnected: false,
    lastMessage: null,
  });
  const messageIdRef = useRef(0);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.jsonrpc === "2.0") {
          setState((prev) => ({ ...prev, lastMessage: data, isConnected: true }));
          console.log("[MCP Bridge] Received:", data.method, data.params);
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleMessage);
    const hasOpenAIBridge = Boolean(window.openai?.callTool);
    setState((prev) => ({ ...prev, isConnected: true }));
    console.log(`[MCP Bridge] Initialized (${hasOpenAIBridge ? "openai bridge" : "mock mode"})`);

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const emit = useCallback((method: string, params?: Record<string, unknown>) => {
    const message: MCPMessage = {
      jsonrpc: "2.0",
      method,
      params,
      id: ++messageIdRef.current,
    };

    try {
      window.parent.postMessage(JSON.stringify(message), "*");
    } catch {
      // Not in iframe, log instead
    }
    console.log("[MCP Bridge] Emitted:", method, params);
    return message.id;
  }, []);

  const callTool = useCallback(
    async (toolName: string, args?: Record<string, unknown>) => {
      if (window.openai?.callTool) {
        const result = await window.openai.callTool(toolName, args);
        return result;
      }
      return emit("tools/call", { name: toolName, arguments: args });
    },
    [emit]
  );

  const updateModelContext = useCallback(
    async (context: Record<string, unknown>) => {
      if (window.openai?.setModelContext) {
        return window.openai.setModelContext(context);
      }
      if (window.openai?.updateModelContext) {
        return window.openai.updateModelContext(context);
      }
      return emit("ui/update-model-context", context);
    },
    [emit]
  );

  return {
    isConnected: state.isConnected,
    lastMessage: state.lastMessage,
    emit,
    callTool,
    updateModelContext,
  };
}
