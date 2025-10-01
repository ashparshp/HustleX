import React from "react";

const FormattedMessage = ({ content }) => {
  const formatContent = (text) => {
    const lines = text.split("\n");
    const elements = [];
    let listItems = [];
    let inList = false;
    let currentSection = null;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-2 my-3 ml-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm leading-relaxed">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span>{parseInlineFormatting(item)}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
      inList = false;
    };

    const parseInlineFormatting = (line) => {
      // Split by bold markers (**text**)
      const parts = line.split(/(\*\*.*?\*\*)/g);

      return parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong
              key={idx}
              className="font-bold text-gray-900 dark:text-white"
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={idx}>{part}</span>;
      });
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Empty line
      if (!trimmedLine) {
        flushList();
        if (currentSection) {
          elements.push(currentSection);
          currentSection = null;
        }
        elements.push(<div key={`space-${index}`} className="h-2" />);
        return;
      }

      // Main heading (starts with **)
      if (trimmedLine.match(/^\*\*(.+?)\*\*:?$/)) {
        flushList();
        if (currentSection) {
          elements.push(currentSection);
          currentSection = null;
        }
        const heading = trimmedLine.slice(2, -2).replace(/:$/, "");
        elements.push(
          <div
            key={`heading-${index}`}
            className="mt-4 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700"
          >
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              {heading}
            </h4>
          </div>
        );
        return;
      }

      // Subheading or section with bold text (contains ** in middle)
      if (trimmedLine.includes("**") && !trimmedLine.startsWith("*")) {
        flushList();
        if (currentSection) {
          elements.push(currentSection);
          currentSection = null;
        }
        elements.push(
          <div key={`section-${index}`} className="my-3">
            {parseInlineFormatting(trimmedLine)}
          </div>
        );
        return;
      }

      // List item (starts with *)
      if (trimmedLine.match(/^\*\s+(.+)/)) {
        const content = trimmedLine.replace(/^\*\s+/, "");
        listItems.push(content);
        inList = true;
        return;
      }

      // Numbered/labeled item (e.g., "Week 1:", "Overall:")
      if (trimmedLine.match(/^(Week \d+|Overall Trend|Timetable):/i)) {
        flushList();
        if (currentSection) {
          elements.push(currentSection);
        }
        currentSection = (
          <div
            key={`section-${index}`}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 my-2 border-l-4 border-blue-500"
          >
            <div className="font-semibold text-gray-900 dark:text-white mb-1">
              {parseInlineFormatting(trimmedLine)}
            </div>
          </div>
        );
        return;
      }

      // Content line within a section
      if (currentSection && trimmedLine) {
        const prevContent = currentSection.props.children[0];
        currentSection = (
          <div
            key={`section-${index}`}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 my-2 border-l-4 border-blue-500"
          >
            {prevContent}
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {parseInlineFormatting(trimmedLine)}
            </div>
          </div>
        );
        return;
      }

      // Regular paragraph
      flushList();
      if (currentSection) {
        elements.push(currentSection);
        currentSection = null;
      }
      elements.push(
        <p
          key={`p-${index}`}
          className="text-sm leading-relaxed my-2 text-gray-700 dark:text-gray-300"
        >
          {parseInlineFormatting(trimmedLine)}
        </p>
      );
    });

    flushList();
    if (currentSection) {
      elements.push(currentSection);
    }

    return elements;
  };

  return <div className="space-y-1">{formatContent(content)}</div>;
};

export default FormattedMessage;
