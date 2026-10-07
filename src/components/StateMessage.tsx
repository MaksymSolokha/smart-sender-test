import type { ReactNode } from 'react';

export function Spinner({ label = 'Завантаження…' }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden /> {label}
    </div>
  );
}

interface StateMessageProps {
  title: string;
  children?: ReactNode;
  tone?: 'neutral' | 'error';
}

export function StateMessage({ title, children, tone = 'neutral' }: StateMessageProps) {
  return (
    <div className={`state state-${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <strong>{title}</strong>
      {children}
    </div>
  );
}
