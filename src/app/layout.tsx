import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PressFlow — 대학 언론홍보 관리 시스템",
  description:
    "대학 홍보팀의 언론홍보 신청·검토·수정이력·영문본 검토·대시보드·뉴스 모니터링을 하나로.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 첫 페인트 전에 저장된 테마 적용(깜빡임 방지) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('pf_theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
