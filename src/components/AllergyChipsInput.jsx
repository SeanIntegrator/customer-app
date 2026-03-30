import { useState, useRef, useId } from 'react';
import { UK_ALLERGENS } from '../data/ukAllergens';

const MAX_CHIPS = 24;
const MAX_LEN = 120;

/**
 * @param {{ value: string[], onChange: (next: string[]) => void }} props
 */
export default function AllergyChipsInput({ value, onChange }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const id = useId();

  const addChip = (raw) => {
    const s = String(raw ?? '')
      .trim()
      .slice(0, MAX_LEN);
    if (!s) return;
    if (value.length >= MAX_CHIPS) return;
    if (value.includes(s)) {
      setDraft('');
      return;
    }
    onChange([...value, s]);
    setDraft('');
  };

  const removeChip = (label) => {
    onChange(value.filter((x) => x !== label));
  };

  const commitDraft = () => {
    if (!draft.trim()) return;
    addChip(draft);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitDraft();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.5)',
        border: '1.5px solid #e0d0b0',
        borderRadius: 14,
        padding: '10px 12px',
        minHeight: 48,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {value.map((chip) => (
        <span
          key={chip}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(26,46,26,0.12)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: '#1a2e1a',
            maxWidth: '100%',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{chip}</span>
          <button
            type="button"
            aria-label={`Remove ${chip}`}
            onClick={() => removeChip(chip)}
            style={{
              border: 'none',
              background: 'rgba(26,46,26,0.15)',
              borderRadius: '50%',
              width: 20,
              height: 20,
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1,
              padding: 0,
              color: '#1a2e1a',
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (draft.trim()) commitDraft();
        }}
        list={id}
        placeholder={value.length === 0 ? 'Type or pick an allergen…' : 'Add another…'}
        className="focus:outline-none"
        style={{
          flex: '1 1 120px',
          minWidth: 100,
          border: 'none',
          background: 'transparent',
          fontSize: 13,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          color: '#1a2e1a',
        }}
      />
      <datalist id={id}>
        {UK_ALLERGENS.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
    </div>
  );
}
