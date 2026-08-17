"use client";

import { useEffect } from "react";

// 기존 페이지 위에 뜨는 팝업(모달). 내용이 길면 본문이 스크롤된다.
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-3xl",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  // 열려 있는 동안 배경 스크롤 잠금 + ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`my-4 w-full ${maxWidth} rounded-2xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between gap-3 border-b border-pgray-100 px-5 py-3">
          <div className="min-w-0 truncate text-base font-bold text-pgray-900">{title}</div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 rounded-lg px-2 py-1 text-lg text-pgray-400 hover:bg-pgray-100 hover:text-pgray-700"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
