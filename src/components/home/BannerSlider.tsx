"use client";

import { useRef, useState } from "react";

const STEPS = [
  {
    step: 1,
    emoji: "👥",
    title: "Create a Group",
    desc: "Invite your friends and form a photo crew",
    bg: "from-orange-100 to-amber-50",
  },
  {
    step: 2,
    emoji: "📸",
    title: "Daily Mission",
    desc: "A new photo mission drops every morning at 10 AM",
    bg: "from-blue-100 to-sky-50",
  },
  {
    step: 3,
    emoji: "🧩",
    title: "Collage",
    desc: "When everyone submits, a group collage is created",
    bg: "from-green-100 to-emerald-50",
  },
];

export default function BannerSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const cardWidth = scrollRef.current.offsetWidth * 0.8;
    setActive(Math.round(scrollLeft / cardWidth));
  };

  return (
    <div className="mb-2">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {STEPS.map((s) => (
          <div
            key={s.step}
            className={`flex-none snap-center w-[80%] rounded-2xl bg-gradient-to-br ${s.bg} p-5`}
          >
            <div className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Step {s.step}
            </div>
            <div className="mb-2 text-3xl">{s.emoji}</div>
            <h3 className="mb-1 text-base font-bold text-gray-900">
              {s.title}
            </h3>
            <p className="text-sm text-gray-600">{s.desc}</p>
          </div>
        ))}
      </div>
      {/* Dots */}
      <div className="flex justify-center gap-1.5 pt-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === active
                ? "w-4 bg-[var(--color-brand)]"
                : "w-1.5 bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
