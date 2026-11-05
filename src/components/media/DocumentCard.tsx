import React from "react";
import { FileText, Download, FileSpreadsheet, FileCode, File, ChevronRight } from "lucide-react";
import { getExtension } from "@/lib/utils/mime";

interface DocumentCardProps {
  url?: string;
  filename: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ url, filename }) => {
  const ext = getExtension(filename).toUpperCase() || "DOC";

  const getIcon = () => {
    switch (ext) {
      case "PDF":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "XLS":
      case "XLSX":
      case "CSV":
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case "JS":
      case "TS":
      case "PY":
      case "HTML":
      case "JSON":
        return <FileCode className="w-5 h-5 text-amber-500" />;
      default:
        return <File className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleClick = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-2.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer min-w-[220px] max-w-[290px] transition select-none"
    >
      <div className="w-10 h-10 rounded-lg bg-white dark:bg-wa-dark-panel flex items-center justify-center shrink-0 shadow-xs border border-black/5">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">
          {filename}
        </div>
        <div className="text-[11px] text-gray-500 dark:text-gray-400">
          {ext} Document
        </div>
      </div>

      <div className="text-gray-400 shrink-0">
        {url ? <Download className="w-4 h-4" /> : <span className="text-[10px] text-gray-400">N/A</span>}
      </div>
    </div>
  );
};

