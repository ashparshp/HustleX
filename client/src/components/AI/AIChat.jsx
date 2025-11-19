import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, User, Cpu } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import LoadingSpinner from "../common/LoadingSpinner";
import FormattedMessage from "./FormattedMessage";

const AIChat = ({ onSendMessage, messages = [], isLoading = false }) => {
  const messagesEndRef = useRef(null);
  const { isDark } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      className={`flex flex-col h-full rounded-lg border ${
        isDark ? "bg-gray-900/50 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      {}
      <div
        className={`p-4 border-b ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <Cpu
            className={`w-6 h-6 ${
              isDark ? "text-indigo-400" : "text-indigo-500"
            }`}
          />

          <div>
            <h3
              className={`text-xl font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              AI Chat
            </h3>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Ask me anything about your productivity data
            </p>
          </div>
        </div>
      </div>

      {}
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                isDark
                  ? "bg-gray-800 text-gray-600"
                  : "bg-gray-100 text-gray-300"
              }`}
            >
              <Cpu className="w-10 h-10" />
            </div>
            <h3
              className={`text-xl font-semibold mb-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              How can I help you today?
            </h3>
            <p
              className={`max-w-md mb-8 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              I can analyze your schedules, track your skill progress, and help
              you optimize your workflow.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {[
                "What are my most productive hours?",
                "How is my skill progress?",
                "Summarize my last week",
                "Suggest a schedule for tomorrow",
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(suggestion);
                    // Optional: auto-submit
                  }}
                  className={`p-3 rounded-xl text-sm font-medium text-left transition-all ${
                    isDark
                      ? "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700"
                      : "bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm hover:shadow"
                  }`}
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDark ? "bg-indigo-500/20" : "bg-indigo-100"
                    }`}
                  >
                    <Cpu
                      className={`w-5 h-5 ${
                        isDark ? "text-indigo-400" : "text-indigo-600"
                      }`}
                    />
                  </div>
                </div>
              )}

              <div
                className={`max-w-[85%] lg:max-w-[75%] rounded-2xl px-6 py-5 shadow-md ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : isDark
                    ? "bg-gray-800 border border-gray-700 text-gray-100"
                    : "bg-white border border-gray-100 text-gray-900"
                }`}
              >
                {message.role === "user" ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                ) : (
                  <FormattedMessage content={message.content} />
                )}
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDark ? "bg-gray-700" : "bg-gray-300"
                    }`}
                  >
                    <User
                      className={`w-5 h-5 ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? "bg-indigo-500/20" : "bg-indigo-100"
                }`}
              >
                <Cpu
                  className={`w-5 h-5 ${
                    isDark ? "text-indigo-400" : "text-indigo-600"
                  }`}
                />
              </div>
            </div>
            <div
              className={`rounded-lg p-3 border ${
                isDark
                  ? "bg-gray-900/70 border-gray-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <LoadingSpinner size="small" showText={false} fullPage={false} />
            </div>
          </motion.div>
        )}

        {}
        <div ref={messagesEndRef} />
      </div>

      {}
      {/* Input Area */}
      <div
        className={`p-4 border-t ${
          isDark
            ? "border-gray-700 bg-gray-900/30"
            : "border-gray-200 bg-gray-50/50"
        }`}
      >
        <form onSubmit={handleSubmit} className="flex gap-3 relative">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your productivity..."
              className={`w-full px-5 py-3.5 pr-12 border rounded-2xl resize-none focus:outline-none focus:ring-2 transition-all shadow-sm ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-indigo-500/50 focus:border-indigo-500"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-indigo-500/20 focus:border-indigo-500"
              }`}
              rows="1"
              disabled={isLoading}
              style={{ minHeight: "52px", maxHeight: "120px" }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`px-5 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center shadow-lg shadow-indigo-500/20 ${
              isDark
                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none h-[52px] w-[52px]`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
