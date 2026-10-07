import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 300;

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  const committed = useRef(value);

  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = draft.trim();
      if (next !== committed.current) {
        committed.current = next;
        onChange(next);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, onChange]);

  return (
    <input
      type="search"
      className="search"
      placeholder="Search by name"
      aria-label="Search by name"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
    />
  );
}
