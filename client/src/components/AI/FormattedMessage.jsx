import React from "react";

const FormattedMessage = ({ content = "" }) => {
  // Minimal inline bold parser (**text**)
  const renderInline = (line) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const lines = content.split("\n");
  const elements = [];
  let listBuffer = [];
  let listType = null; // 'ul' | 'ol'

  const flushList = () => {
    if (!listType || listBuffer.length === 0) return;
    if (listType === "ul") {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="list-disc pl-5 my-3 space-y-1"
        >
          {listBuffer.map((txt, i) => (
            <li
              key={i}
              className="text-sm leading-relaxed text-black dark:text-gray-100"
            >
              {renderInline(txt)}
            </li>
          ))}
        </ul>
      );
    } else if (listType === "ol") {
      elements.push(
        <ol
          key={`ol-${elements.length}`}
          className="list-decimal pl-5 my-3 space-y-1"
        >
          {listBuffer.map((txt, i) => (
            <li
              key={i}
              className="text-sm leading-relaxed text-black dark:text-gray-100"
            >
              {renderInline(txt)}
            </li>
          ))}
        </ol>
      );
    }
    listBuffer = [];
    listType = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trim();

    if (!line) {
      flushList();
      elements.push(<div key={`sp-${idx}`} className="h-2" />);
      return;
    }

    // Headings: ###, ##, or **Heading**
    const headingMatch =
      line.match(/^#{1,3}\s+(.+)/) || line.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (headingMatch) {
      flushList();
      const heading = (headingMatch[1] || line)
        .replace(/^\*\*/, "")
        .replace(/\*\*:?:?\s*$/, "");
      elements.push(
        <h3
          key={`h-${idx}`}
          className="text-base font-semibold text-black dark:text-white mt-4"
        >
          {heading}
        </h3>
      );
      return;
    }

    // Bulleted list ("* " or "- ")
    const bullet = line.match(/^([*-])\s+(.+)/);
    if (bullet) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listBuffer.push(bullet[2]);
      return;
    }

    // Numbered list ("1. ")
    const numbered = line.match(/^\d+\.\s+(.+)/);
    if (numbered) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listBuffer.push(numbered[1]);
      return;
    }

    // Callouts starting with emoji
    if (/^[⚠️💡✨🎯📌🔍]/.test(line)) {
      flushList();
      elements.push(
        <div
          key={`co-${idx}`}
          className="my-3 p-3 rounded-md border bg-gray-50/70 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm leading-relaxed text-black dark:text-gray-200 font-medium">
            {renderInline(line)}
          </p>
        </div>
      );
      return;
    }

    // Default paragraph
    flushList();
    elements.push(
      <p
        key={`p-${idx}`}
        className="text-sm leading-relaxed text-black dark:text-gray-300 my-2"
      >
        {renderInline(line)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1 max-w-full">{elements}</div>;
};

export default FormattedMessage;
