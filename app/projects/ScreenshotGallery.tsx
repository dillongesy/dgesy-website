export default function ScreenshotGallery({ screenshots }: { screenshots: string[] }) {
  return (
    <div
      className="
        flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2
        [&::-webkit-scrollbar]:h-[6px]
        [&::-webkit-scrollbar-track]:rounded-full
        [&::-webkit-scrollbar-track]:bg-white/[0.04]
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-indigo-500/50
      "
      style={{ scrollbarWidth: "auto", scrollbarColor: "#6366f1 rgba(255,255,255,0.04)" }}
    >
      {screenshots.map((src, i) => (
        <div
          key={i}
          className="flex-shrink-0 snap-start rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
        >
          <img
            src={src}
            alt={`Screenshot ${i + 1}`}
            className="h-[300px] w-auto block"
          />
        </div>
      ))}
    </div>
  );
}
