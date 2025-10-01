import { Lightbulb, ListChecks, BarChart3, Info } from "lucide-react";

const FormattedMessage = ({ content = "" }) => {
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

  const parseSections = (raw) => {
    if (!raw || typeof raw !== "string") return null;
    let lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const greetRe = /^(hi|hello|hey|hiya|greetings)[,!]?\b/i;
    while (lines.length && greetRe.test(lines[0])) {
      lines.shift();
    }

    const findIdx = (re) => lines.findIndex((l) => re.test(l));
    const idxObs = findIdx(/^key\s+observations.*:$/i);
    const idxData = findIdx(/^(specific\s+data\s+points|key\s+metrics).*:$/i);
    const idxSummary = findIdx(/^(in\s+summary|summary)[:]?/i);

    if (idxObs === -1 && idxData === -1 && idxSummary === -1) return null;

    const firstIdx = [idxObs, idxData, idxSummary]
      .filter((i) => i !== -1)
      .sort((a, b) => a - b)[0];

    const introLines = lines.slice(0, firstIdx);
    const intro = introLines
      .join(" ")
      .replace(/:$/g, "")
      .replace(/^based on\b/i, (m) => m[0].toUpperCase() + m.slice(1));

    const takeSection = (start, end) =>
      start === -1 ? [] : lines.slice(start + 1, end).filter(Boolean);

    const endObs = [idxData, idxSummary, lines.length]
      .filter((x) => x !== -1)
      .sort((a, b) => a - b)[0];
    const endData = [idxSummary, lines.length]
      .filter((x) => x !== -1)
      .sort((a, b) => a - b)[0];

    const observationsRaw = takeSection(idxObs, endObs);
    const dataPointsRaw = takeSection(idxData, endData);
    const summaryRaw =
      idxSummary === -1 ? [] : lines.slice(idxSummary).slice(1);

    const normalizeList = (arr) =>
      arr.map((l) => l.replace(/^([*\-•]\s+)/, "").trim()).filter(Boolean);

    const observations = normalizeList(observationsRaw);

    const dataPoints = normalizeList(dataPointsRaw).map((l) => {
      const m = l.match(/^([^:]+):\s*(.+)$/);
      const label = m ? m[1].trim() : l;
      const valueStr = m ? m[2].trim() : "";
      const percentMatch = valueStr.match(/(\+|-)?\d+(?:\.\d+)?%/);
      const parenMatch = valueStr.match(/\(([^)]+)\)/);
      const primary = valueStr.replace(/\s*\([^)]*\)\s*$/, "");
      return {
        label,
        value: primary,
        percent: percentMatch ? percentMatch[0] : null,
        extra: parenMatch ? parenMatch[1] : null,
        raw: l,
      };
    });

    const summary = summaryRaw
      .join(" ")
      .replace(/^(in\s+summary[:,]?\s*)/i, "")
      .trim();

    return { intro, observations, dataPoints, summary };
  };

  const sections = parseSections(content);

  if (sections) {
    const { intro, observations, dataPoints, summary } = sections;
    return (
      <div className="space-y-4 max-w-full">
        {(intro || true) && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/40 to-blue-500/40 rounded-xl blur opacity-30 group-hover:opacity-50 transition" />
            <div className="relative p-5 rounded-xl border bg-white/80 dark:bg-black/40 backdrop-blur-sm border-indigo-300/40 dark:border-indigo-500/30">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Insights summary
                  </h3>
                  {intro && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {renderInline(intro)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {observations?.length > 0 && (
          <div className="p-5 rounded-xl border bg-gray-50/70 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Key observations & recommendations
              </h4>
            </div>
            <ul className="space-y-2 pl-1">
              {observations.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100">
                    {renderInline(item)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {dataPoints?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Specific data points
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dataPoints.map((dp, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border bg-white/70 dark:bg-black/40 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                >
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                    {dp.label}
                  </div>
                  <div className="mt-1.5 flex items-center flex-wrap gap-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {dp.value}
                    </span>
                    {dp.percent && (
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${
                          /-/.test(dp.percent)
                            ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                        }`}
                      >
                        {dp.percent}
                      </span>
                    )}
                  </div>
                  {dp.extra && (
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      {dp.extra}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {summary && (
          <div className="my-1 p-4 rounded-lg border bg-amber-50/70 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100">
                {renderInline(summary)}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const lines = content.split("\n");
  const elements = [];
  let listBuffer = [];
  let listType = null;

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

    const headingMatch =
      line.match(/^#{1,3}\s+(.+)/) || line.match(/^\*\*(.+?)\*\*:?:?\s*$/);
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

    const bullet = line.match(/^([*-])\s+(.+)/);
    if (bullet) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listBuffer.push(bullet[2]);
      return;
    }

    const numbered = line.match(/^\d+\.\s+(.+)/);
    if (numbered) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listBuffer.push(numbered[1]);
      return;
    }

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
