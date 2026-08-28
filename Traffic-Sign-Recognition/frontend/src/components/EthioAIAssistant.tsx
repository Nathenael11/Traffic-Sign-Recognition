import React, { useState } from "react";

interface Message {
  sender: "bot" | "user";
  text: string;
}

export const EthioAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Salam! Welcome to the MInT Innovation Incubator Platform. I am Beta, your AI startup assistant. How can I help you today?",
    },
  ]);

  const quickReplies = [
    { label: "How do I start?", answer: "Click 'Get Started' or 'Register' to create a free Innovator account. Once logged in, go to the [Idea Hub] and submit your project. You can use our AI pitch refiner to optimize it!" },
    { label: "What is this platform?", answer: "The MInT Innovation Incubator Platform (IIP) is a national digital ecosystem designed by the Ministry of Innovation and Technology to help Ethiopian startups access mentorship, cloud sandbox testing, and grant capital." },
    { label: "How can I get grants?", answer: "First submit your startup concept in the [Idea Hub]. Then go to the [Grants] tab, choose an open capital fund (like the MInT National Innovation Grant), and click 'Apply Now' using your submitted project." },
    { label: "What is the Sandbox?", answer: "The Sandbox is a technical development environment (Module C). It guides you through feature planning, designs database schemas based on your tech stack, and simulates serverless container deployments with real-time logs." }
  ];

  const handleQuickReply = (label: string, answer: string) => {
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: label },
      { sender: "bot", text: answer }
    ]);
  };

  const [inputVal, setInputVal] = useState("");
  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: inputVal },
      { sender: "bot", text: "I am currently in Beta mode. Custom text queries are simulated. Please use our quick-reply options above for the best assistance!" }
    ]);
    setInputVal("");
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, fontFamily: "var(--font-sans)" }}>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: "60px",
          width: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
          color: "#ffffff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(15, 41, 99, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.75rem",
          transition: "transform 0.3s ease",
          position: "relative"
        }}
        className="hover-scale"
        title="Ask Beta - AI Assistant"
      >
        {isOpen ? "✕" : "🤖"}
        {!isOpen && (
          <span style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            height: "12px",
            width: "12px",
            borderRadius: "50%",
            background: "var(--error)",
            border: "2px solid #ffffff",
            animation: "pulse 2s infinite"
          }}></span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "absolute",
          bottom: "75px",
          right: "0",
          width: "350px",
          height: "480px",
          background: "var(--bg-card)",
          backdropFilter: "var(--glass-blur)",
          border: "1px solid var(--border-card)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "fadeInUp 0.3s ease"
        }}>
          {/* Header */}
          <div style={{
            background: "var(--primary)",
            color: "#ffffff",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            borderBottom: "2px solid var(--accent)"
          }}>
            <div style={{ fontSize: "1.5rem" }}>🤖</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>EthioAI Assistant</div>
              <div style={{ fontSize: "0.7rem", color: "var(--accent)" }}>Beta Online | MInT Support</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: "1rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background: msg.sender === "user" ? "var(--primary)" : "rgba(255,255,255,0.05)",
                  color: msg.sender === "user" ? "#ffffff" : "var(--text-main)",
                  border: msg.sender === "user" ? "none" : "1px solid var(--border-card)",
                  padding: "0.65rem 0.85rem",
                  borderRadius: msg.sender === "user" ? "12px 12px 0 12px" : "12px 12px 12px 0",
                  fontSize: "0.85rem",
                  lineHeight: "1.4"
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Quick replies */}
          <div style={{
            padding: "0.5rem 1rem",
            borderTop: "1px solid var(--border-card)",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.35rem"
          }}>
            {quickReplies.map((qr) => (
              <button
                key={qr.label}
                onClick={() => handleQuickReply(qr.label, qr.answer)}
                style={{
                  background: "rgba(15, 41, 99, 0.05)",
                  border: "1px solid var(--border-card)",
                  borderRadius: "15px",
                  padding: "0.25rem 0.65rem",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  transition: "var(--transition-smooth)"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "var(--primary)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(15, 41, 99, 0.05)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                {qr.label}
              </button>
            ))}
          </div>

          {/* Text Input */}
          <form onSubmit={handleSendCustom} style={{
            padding: "0.75rem",
            borderTop: "1px solid var(--border-card)",
            display: "flex",
            gap: "0.5rem"
          }}>
            <input
              type="text"
              placeholder="Type your message..."
              className="form-control"
              style={{ flex: 1, padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem" }}>
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
