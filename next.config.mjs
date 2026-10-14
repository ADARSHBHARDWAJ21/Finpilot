/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
  },
  outputFileTracingIncludes: {
    "/api/process-statement": ["./eng.traineddata"],
  },
  serverExternalPackages: [
    "pdf-parse",
    "pdfjs-dist",
    "tesseract.js",
    "sharp",
    "canvas",
  ],
};

export default nextConfig;
