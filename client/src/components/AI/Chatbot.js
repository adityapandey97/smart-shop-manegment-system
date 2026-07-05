// ============================================
//   Chatbot Component
//   Floating agentic AI chat advisor
// ============================================

import React, { useState, useRef, useEffect } from "react";
import { reportAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const Chatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "👋 Hello! I am your SmartShop AI Advisor. Ask me anything about product stock, sales, expenses, or market pricing trends!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!user) return null; // Don't render if not logged in

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await reportAPI.chatAssistant(userMessage);
      setMessages((prev) => [...prev, { sender: "ai", text: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ Sorry, I encountered an error checking pricing or database records. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format basic markdown-like text (*bold* or **bold** or newlines)
  const formatText = (text) => {
    return text.split("\n").map((line, idx) => {
      // Replace **text** with bold
      let formatted = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        // Add preceding text
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        // Add bold element
        parts.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      // Fallback if no bold match found
      const content = parts.length > 0 ? parts : line;

      return (
        <div key={idx} style={{ minHeight: "1.2em", margin: "4px 0" }}>
          {content}
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
          color: "#fff",
          border: "none",
          boxShadow: "0 8px 24px rgba(15, 118, 110, 0.4)",
          cursor: "pointer",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        title="AI Business Advisor"
      >
        {isOpen ? "✕" : "🤖"}
      </button>

      {/* Chat sliding panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 96,
            right: 24,
            width: 380,
            height: 520,
            background: "var(--bg-card)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            boxShadow: "var(--shadow-lg)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px",
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}
          >
            <div style={{ fontSize: 24 }}>🤖</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>SmartShop AI Advisor</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Market Trends & Pricing Intel</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: 18
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages Log */}
          <div
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--bg-body)",
              transition: "background 0.3s"
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 13,
                  lineHeight: "1.5",
                  background: m.sender === "user" ? "var(--primary)" : "var(--bg-card)",
                  color: m.sender === "user" ? "#fff" : "var(--text-primary)",
                  border: m.sender === "user" ? "none" : "1px solid var(--border)",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)"
                }}
              >
                {formatText(m.text)}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  padding: "10px 14px",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--text-muted)",
                  fontSize: 12
                }}
              >
                <span className="spinner spinner-primary" style={{ width: 14, height: 14, borderWidth: 2 }} />
                AI is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <form
            onSubmit={handleSend}
            style={{
              padding: "12px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg-card)",
              display: "flex",
              gap: 8
            }}
          >
            <input
              type="text"
              placeholder="Ask about prices, stock, trends..."
              className="form-control"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 20 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!input.trim() || loading}
              style={{
                borderRadius: "50%",
                width: 36,
                height: 36,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ➔
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
