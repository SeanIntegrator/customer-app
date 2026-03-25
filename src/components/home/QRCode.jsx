export default function QRCode({ size = 160 }) {
  const M = 10;
  const G = 21;

  function isFilled(r, c) {
    if (r < 8 && c < 8) return false;
    if (r < 8 && c > G - 9) return false;
    if (r > G - 9 && c < 8) return false;
    if (r === 6 && c > 7 && c < G - 8) return c % 2 === 0;
    if (c === 6 && r > 7 && r < G - 8) return r % 2 === 0;
    return (r * 31 + c * 17 + r * c * 7 + (r ^ c) * 3) % 100 < 48;
  }

  const S = M * G;
  const modules = [];
  for (let r = 0; r < G; r++)
    for (let c = 0; c < G; c++)
      if (isFilled(r, c)) modules.push([c * M, r * M]);

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <rect width={S} height={S} fill="white" />
      {modules.map(([x, y], i) => (
        <rect key={i} x={x + 0.5} y={y + 0.5} width={M - 1} height={M - 1} rx="1.5" fill="#122012" />
      ))}
      <rect x={0} y={0} width={M * 7} height={M * 7} rx={6} fill="#122012" />
      <rect x={M} y={M} width={M * 5} height={M * 5} rx={4} fill="white" />
      <rect x={M * 2} y={M * 2} width={M * 3} height={M * 3} rx={2} fill="#122012" />
      <rect x={M * 14} y={0} width={M * 7} height={M * 7} rx={6} fill="#122012" />
      <rect x={M * 15} y={M} width={M * 5} height={M * 5} rx={4} fill="white" />
      <rect x={M * 16} y={M * 2} width={M * 3} height={M * 3} rx={2} fill="#122012" />
      <rect x={0} y={M * 14} width={M * 7} height={M * 7} rx={6} fill="#122012" />
      <rect x={M} y={M * 15} width={M * 5} height={M * 5} rx={4} fill="white" />
      <rect x={M * 2} y={M * 16} width={M * 3} height={M * 3} rx={2} fill="#122012" />
    </svg>
  );
}
