import { motion } from 'framer-motion';

export default function StampCard({ stamps = 0, goal = 9, compact: _compact = false }) {
  const remaining = goal - stamps;

  return (
    <div className="bg-card-dark rounded-2xl p-5 text-cream shadow-warm-lg relative overflow-hidden">
      {/* Decorative background rings */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-cream/5" />
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full border border-cream/8" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-cream/50 text-[10px] font-semibold tracking-[0.15em] uppercase mb-1">
            Loyalty Card
          </p>
          <h3 className="font-display text-xl font-semibold text-cream leading-tight">
            Clay & Bean
          </h3>
        </div>
        <div className="text-2xl opacity-70">☕</div>
      </div>

      {/* Stamp grid */}
      <div className="grid grid-cols-9 gap-1.5 mb-4">
        {Array.from({ length: goal }).map((_, i) => {
          const filled = i < stamps;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={filled ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0.25 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 20,
                delay: filled ? i * 0.05 : 0,
              }}
              className={`aspect-square rounded-full flex items-center justify-center text-[10px] transition-colors ${
                filled ? 'bg-clay border border-clay/50' : 'border border-cream/20'
              }`}
            >
              {filled && (
                <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                  <circle cx="6" cy="6" r="3" fill="rgba(241,243,230,0.8)" />
                </svg>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Status text */}
      <div className="flex items-center justify-between">
        <p className="text-cream/70 text-xs font-sans">
          {stamps}/{goal} stamps
        </p>
        <p className="text-cream/90 text-xs font-sans font-semibold">
          {remaining === 0 ? '🎉 Free coffee ready!' : `${remaining} until your free coffee`}
        </p>
      </div>
    </div>
  );
}
