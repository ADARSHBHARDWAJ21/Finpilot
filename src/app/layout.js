import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Finpilot — Your money, thoughtfully organised",
  description: "A considered space for your everyday finances, budgets, goals and Indian tax preparation.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#214d43",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${jakarta.variable} h-full antialiased selection:bg-primary/20 selection:text-foreground`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
