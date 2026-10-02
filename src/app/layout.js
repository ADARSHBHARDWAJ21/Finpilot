import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "FinCopilot — Autonomous AI Finance & Tax Copilot for India",
  description: "Next-gen intelligent personal finance, tax optimization, net worth analytics, and autonomous wealth guidance.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} h-full antialiased selection:bg-indigo-500 selection:text-white`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#f8fafc] text-slate-900 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}



