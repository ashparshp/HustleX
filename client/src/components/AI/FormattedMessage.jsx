import React from "react";
import {
  Sparkles,
  TrendingUp,
  Calendar,
  Target,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

const FormattedMessage = ({ content }) => {
  const formatContent = (text) => {
    const lines = text.split("\n");
    const elements = [];
    let listItems = [];
    let inList = false;
    let currentCard = null;
    let cardContent = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-2.5 my-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex gap-3 items-start group">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 mt-2" />
                <span className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {parseInlineFormatting(item)}
                </span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
      inList = false;
    };

    const flushCard = () => {
      if (currentCard && cardContent.length > 0) {
        elements.push(
          <div
            key={`card-${elements.length}`}
            className="my-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 backdrop-blur-sm"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <getCardIcon type={currentCard.type} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {parseInlineFormatting(currentCard.title)}
                </h4>
              </div>
            </div>
            <div className="ml-11 space-y-2">
              {cardContent.map((line, idx) => (
                <p
                  key={idx}
                  className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                >
                  {parseInlineFormatting(line)}
                </p>
              ))}
            </div>
          </div>
        );
        currentCard = null;
        cardContent = [];
      }
    };

    const getCardIcon = ({ type }) => {
      const iconProps = { className: "w-4 h-4 text-white", strokeWidth: 2.5 };

      if (type?.includes("week") || type?.includes("trend")) {
        return <TrendingUp {...iconProps} />;
      }
      if (type?.includes("timetable") || type?.includes("schedule")) {
        return <Calendar {...iconProps} />;
      }
      if (type?.includes("goal") || type?.includes("focus")) {
        return <Target {...iconProps} />;
      }
      if (type?.includes("recommendation") || type?.includes("suggest")) {
        return <Lightbulb {...iconProps} />;
      }
      return <Sparkles {...iconProps} />;
    };

    const parseInlineFormatting = (line) => {
      // Handle bold (**text**)
      const parts = line.split(/(\*\*.*?\*\*)/g);

      return parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const text = part.slice(2, -2);
          return (
            <span
              key={idx}
              className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
            >
              {text}
            </span>
          );
        }
        return <span key={idx}>{part}</span>;
      });
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Empty line - flush any pending content
      if (!trimmedLine) {
        flushList();
        flushCard();
        elements.push(<div key={`space-${index}`} className="h-3" />);
        return;
      }

      // Main heading with full bold (### or ## or just **Heading**)
      if (
        trimmedLine.match(/^#{1,3}\s+(.+)/) ||
        trimmedLine.match(/^\*\*(.+?)\*\*:?\s*$/)
      ) {
        flushList();
        flushCard();

        let heading = trimmedLine
          .replace(/^#{1,3}\s+/, "")
          .replace(/^\*\*/, "")
          .replace(/\*\*:?\s*$/, "");

        elements.push(
          <div
            key={`heading-${index}`}
            className="relative mt-6 mb-4 first:mt-0"
          >
            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
            <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent pl-3">
              {heading}
            </h3>
          </div>
        );
        return;
      }

      // Card-style sections (Week 1:, Overall:, Timetable:, etc.)
      const cardMatch = trimmedLine.match(
        /^(Week \d+|Overall Trend|Timetable|Day \d+|Summary|Analysis|Insights?|Recommendations?|Key Points?):\s*(.*)/i
      );
      if (cardMatch) {
        flushList();
        flushCard();

        const title = cardMatch[1];
        const content = cardMatch[2];

        currentCard = {
          title: title,
          type: title.toLowerCase(),
        };

        if (content) {
          cardContent.push(content);
        }
        return;
      }

      // Content line within a card
      if (currentCard && trimmedLine) {
        // Check if it's a new list within the card
        if (trimmedLine.match(/^\*\s+(.+)/)) {
          const content = trimmedLine.replace(/^\*\s+/, "");
          cardContent.push(`• ${content}`);
        } else {
          cardContent.push(trimmedLine);
        }
        return;
      }

      // Bulleted list item
      if (trimmedLine.match(/^\*\s+(.+)/)) {
        flushCard();
        const content = trimmedLine.replace(/^\*\s+/, "");
        listItems.push(content);
        inList = true;
        return;
      }

      // Numbered list or actionable items
      if (trimmedLine.match(/^\d+\.\s+(.+)/)) {
        flushCard();
        flushList();

        const content = trimmedLine.replace(/^\d+\.\s+/, "");
        elements.push(
          <div
            key={`numbered-${index}`}
            className="flex gap-3 items-start my-3"
          >
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {trimmedLine.match(/^\d+/)[0]}
              </span>
            </div>
            <span className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 pt-0.5">
              {parseInlineFormatting(content)}
            </span>
          </div>
        );
        return;
      }

      // Important callout (starts with ⚠️, 💡, ✨, or similar emoji/special marker)
      if (trimmedLine.match(/^[⚠️💡✨🎯📌]/)) {
        flushCard();
        flushList();

        elements.push(
          <div
            key={`callout-${index}`}
            className="my-3 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30"
          >
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {parseInlineFormatting(trimmedLine)}
            </p>
          </div>
        );
        return;
      }

      // Regular paragraph with inline formatting
      if (trimmedLine.includes("**")) {
        flushCard();
        flushList();

        elements.push(
          <p
            key={`p-${index}`}
            className="text-sm leading-relaxed my-2.5 text-gray-700 dark:text-gray-300"
          >
            {parseInlineFormatting(trimmedLine)}
          </p>
        );
        return;
      }

      // Plain text paragraph
      flushCard();
      flushList();

      elements.push(
        <p
          key={`p-${index}`}
          className="text-sm leading-relaxed my-2 text-gray-600 dark:text-gray-400"
        >
          {trimmedLine}
        </p>
      );
    });

    flushList();
    flushCard();

    return elements;
  };

  return <div className="space-y-1 max-w-full">{formatContent(content)}</div>;
};

export default FormattedMessage;
