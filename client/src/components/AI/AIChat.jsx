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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Cpu
              className={`mx-auto w-16 h-16 mb-4 ${
                isDark ? "text-gray-600" : "text-gray-300"
              }`}
            />

            <p className={isDark ? "text-gray-400" : "text-gray-500"}>
              Start a conversation with your AI assistant
            </p>
            <div
              className={`mt-4 text-sm ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              <p>Try asking:</p>
              <ul className="mt-2 space-y-1">
                <li>"What are my most productive hours?"</li>
                <li>"How am I progressing on my skills?"</li>
                <li>"What should I focus on this week?"</li>
              </ul>
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
                className={`max-w-[85%] lg:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : isDark
                    ? "bg-gray-800/80 border border-gray-700 text-gray-100"
                    : "bg-white border border-gray-100 text-gray-900"
                }`}
              >
                {message.role === "user" ? (
                  <p className="whitespace-pre-wrap text-sm">
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
      <div
        className={`p-4 border-t ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your productivity..."
            className={`flex-1 px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 transition-all ${
              isDark
                ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
            }`}
            rows="1"
            disabled={isLoading}
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
              isDark
                ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 hover:border-indigo-400"
                : "bg-indigo-500 border border-indigo-500 text-white hover:bg-indigo-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
