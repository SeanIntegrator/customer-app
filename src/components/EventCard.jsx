import { motion } from 'framer-motion';

export default function EventCard({ event, onToggle }) {
  const { title, date, time, description, spotsLeft, totalSpots, emoji, registered } = event;
  const nearlyFull = spotsLeft != null && spotsLeft <= 3;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="bg-warm-white border border-card-border rounded-2xl p-4 shadow-warm flex-shrink-0 w-[260px]"
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold text-bark text-base leading-tight mb-0.5">
            {title}
          </h4>
          <p className="text-earth text-xs font-sans">
            {date} · {time}
          </p>
        </div>
      </div>

      <p className="text-bark/70 text-sm font-sans leading-relaxed mb-3 line-clamp-2">
        {description}
      </p>

      <div className="flex items-center justify-between">
        {spotsLeft != null ? (
          <span className={`text-xs font-semibold font-sans px-2 py-1 rounded-full ${
            nearlyFull ? 'bg-terracotta/15 text-terracotta' : 'bg-celadon text-moss'
          }`}>
            {spotsLeft === 0 ? 'Full' : `${spotsLeft} spots left`}
          </span>
        ) : (
          <span className="text-xs font-semibold font-sans px-2 py-1 rounded-full bg-celadon text-moss">
            Drop in
          </span>
        )}

        <button
          onClick={() => onToggle?.(event.id)}
          className={`text-xs font-sans font-semibold px-3 py-1.5 rounded-full transition-all ${
            registered
              ? 'bg-sage text-bark'
              : 'bg-bark text-cream hover:bg-clay'
          }`}
        >
          {registered ? '✓ Going' : 'Join'}
        </button>
      </div>
    </motion.div>
  );
}
