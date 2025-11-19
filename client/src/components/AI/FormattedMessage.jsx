import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Calendar } from "lucide-react";

const FormattedMessage = ({ content = "" }) => {
  const formatText = (text) => {
    if (typeof text !== "string") return text;

    // 1. Ranges: 11/17/2025 - 11/24/2025
    const rangeRegex =
      /(\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{4})/g;
    const rangeParts = text.split(rangeRegex);

    return rangeParts.map((part, i) => {
      if (part.match(rangeRegex)) {
        return (
          <span
            key={`range-${i}`}
            className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800 mx-1 align-baseline whitespace-nowrap"
          >
            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
            {part}
          </span>
        );
      }

      // 2. Single dates: 11/17/2025
      const dateRegex = /(\b\d{1,2}\/\d{1,2}\/\d{4}\b)/g;
      const dateParts = part.split(dateRegex);

      if (dateParts.length === 1) return part;

      return dateParts.map((subPart, j) => {
        if (subPart.match(dateRegex)) {
          return (
            <span
              key={`date-${i}-${j}`}
              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 mx-1 align-baseline whitespace-nowrap"
            >
              <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
              {subPart}
            </span>
          );
        }
        return subPart;
      });
    });
  };

  const processChildren = (children) => {
    if (typeof children === "string") return formatText(children);
    if (Array.isArray(children))
      return children.map((child, i) => (
        <React.Fragment key={i}>{processChildren(child)}</React.Fragment>
      ));
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        children: processChildren(children.props.children),
      });
    }
    return children;
  };

  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1
              className="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-white first:mt-0"
              {...props}
            >
              {processChildren(props.children)}
            </h1>
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-lg font-semibold mt-5 mb-2 text-gray-900 dark:text-white"
              {...props}
            >
              {processChildren(props.children)}
            </h2>
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-base font-semibold mt-4 mb-2 text-gray-900 dark:text-white"
              {...props}
            >
              {processChildren(props.children)}
            </h3>
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p
              className="mb-3 last:mb-0 text-gray-700 dark:text-gray-300"
              {...props}
            >
              {processChildren(props.children)}
            </p>
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc pl-5 mb-3 space-y-1 text-gray-700 dark:text-gray-300"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal pl-5 mb-3 space-y-1 text-gray-700 dark:text-gray-300"
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li className="pl-1" {...props}>
              {processChildren(props.children)}
            </li>
          ),

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-indigo-500 pl-4 py-1 my-3 bg-gray-50 dark:bg-gray-800/50 rounded-r italic text-gray-600 dark:text-gray-400"
              {...props}
            >
              {processChildren(props.children)}
            </blockquote>
          ),

          // Code
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            return !inline ? (
              <div className="relative my-4 rounded-lg overflow-hidden bg-gray-900 dark:bg-black border border-gray-800">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
                  <span className="text-xs font-medium text-gray-400">
                    {match ? match[1] : "Code"}
                  </span>
                </div>
                <pre className="p-4 overflow-x-auto text-gray-300 text-xs font-mono">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code
                className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-medium"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <table
                className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-50 dark:bg-gray-800" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody
              className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900"
              {...props}
            />
          ),
          tr: ({ node, ...props }) => <tr className="" {...props} />,
          th: ({ node, ...props }) => (
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              {...props}
            >
              {processChildren(props.children)}
            </th>
          ),
          td: ({ node, ...props }) => (
            <td
              className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
              {...props}
            >
              {processChildren(props.children)}
            </td>
          ),

          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {props.children}
              <ExternalLink className="w-3 h-3" />
            </a>
          ),

          // Horizontal Rule
          hr: ({ node, ...props }) => (
            <hr
              className="my-6 border-gray-200 dark:border-gray-700"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default FormattedMessage;
