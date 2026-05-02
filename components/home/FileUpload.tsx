"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  onHeaderExtracted: (header: string) => void;
}

export default function FileUpload({ onHeaderExtracted }: Props) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [filename, setFilename] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".eml") && !file.name.endsWith(".txt") && !file.name.endsWith(".msg")) {
        setStatus("error");
        setErrorMsg("Please upload a supported email format. Only .eml, .msg, and .txt files are supported.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const raw = e.target?.result as string;
        const blankLine = raw.indexOf("\n\n");
        const header = blankLine !== -1 ? raw.slice(0, blankLine) : raw;
        setFilename(file.name);
        setStatus("success");
        onHeaderExtracted(header);
      };
      reader.onerror = () => {
        setStatus("error");
        setErrorMsg("Failed to read file.");
      };
      reader.readAsText(file);
    },
    [onHeaderExtracted]
  );

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      if (accepted.length > 0) {
        processFile(accepted[0]);
      } else if (rejected.length > 0) {
        const rejection = rejected[0];
        if (rejection.errors?.some((e: any) => e.code === "file-too-large")) {
          setStatus("error");
          setErrorMsg("File is too large. Please upload an email under 5 MB.");
          return;
        }
        const file = rejection.file;
        if (file) processFile(file);
      }
    },
    [processFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      id="file-upload-zone"
      className={`relative flex flex-col items-center justify-center h-56 rounded-none border-2 border-dashed cursor-pointer transition-all mb-4 ${
        isDragActive
          ? "border-hawk-green bg-hawk-green/5"
          : status === "success"
          ? "border-hawk-green/50 bg-hawk-green/5"
          : status === "error"
          ? "border-[#ff4444]/50 bg-[#ff4444]/5"
          : "border-hawk-border bg-hawk-bg/50 hover:border-hawk-border-hover"
      }`}
    >
      <input {...getInputProps()} />

      {status === "success" ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle className="w-10 h-10 text-hawk-green" />
          <div>
            <p className="text-sm font-mono text-hawk-green font-medium">File loaded!</p>
            <p className="text-xs text-hawk-muted mt-1 font-mono">{filename}</p>
            <p className="text-xs text-hawk-muted mt-1">Switching to Paste Header tab…</p>
          </div>
        </div>
      ) : status === "error" ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-[#ff4444]" />
          <div>
            <p className="text-sm font-mono text-[#ff4444]">{errorMsg}</p>
            <p className="text-xs text-hawk-muted mt-1">Click to try again</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <div
            className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
              isDragActive ? "border-hawk-green bg-hawk-green/10" : "border-hawk-border"
            }`}
          >
            {isDragActive ? (
              <FileText className="w-7 h-7 text-hawk-green" />
            ) : (
              <Upload className="w-7 h-7 text-hawk-muted" />
            )}
          </div>
          <div>
            <p className="text-sm font-mono text-hawk-text">
              {isDragActive ? "Drop it here" : "Drop your email file here"}
            </p>
            <p className="text-xs text-hawk-muted font-mono mt-1">
              or <span className="text-hawk-green">click to browse</span> · .eml, .txt, .msg · max 5 MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
