export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center px-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-base sm:text-lg text-gray-500 mt-4">Coming Soon</p>
    </div>
  );
}
