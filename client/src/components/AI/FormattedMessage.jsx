import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Calendar, Copy, Check } from "lucide-react";

const CodeBlock = ({ inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code
        className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-medium border border-gray-200 dark:border-gray-700"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative my-4 rounded-xl overflow-hidden bg-[#1e1e1e] border border-gray-800 shadow-lg group">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <span className="ml-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-gray-300 text-xs font-mono leading-relaxed">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
};

const FormattedMessage = ({
  content = "",
  className = "text-sm leading-relaxed",
}) => {
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
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1
              className="text-2xl font-bold mt-8 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white first:mt-0"
              {...props}
            >
              {processChildren(props.children)}
            </h1>
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-xl font-semibold mt-6 mb-3 pb-1 border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white"
              {...props}
            >
              {processChildren(props.children)}
            </h2>
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-lg font-semibold mt-5 mb-2 text-gray-900 dark:text-white"
              {...props}
            >
              {processChildren(props.children)}
            </h3>
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p
              className="mb-4 last:mb-0 text-gray-700 dark:text-gray-300 leading-7"
              {...props}
            >
              {processChildren(props.children)}
            </p>
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300 marker:text-indigo-500"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300 marker:text-indigo-500 marker:font-medium"
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
              className="border-l-4 border-indigo-500 pl-4 py-2 my-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-r-lg italic text-gray-700 dark:text-gray-300"
              {...props}
            >
              {processChildren(props.children)}
            </blockquote>
          ),

          // Code
          code: CodeBlock,

          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <table
                className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-50 dark:bg-gray-800/50" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody
              className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900"
              {...props}
            />
          ),
          tr: ({ node, ...props }) => (
            <tr
              className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
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
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium hover:underline inline-flex items-center gap-0.5 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {props.children}
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          ),

          // Horizontal Rule
          hr: ({ node, ...props }) => (
            <hr
              className="my-8 border-gray-200 dark:border-gray-700"
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
