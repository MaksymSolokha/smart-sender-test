interface PaginationProps {
  page: number;
  lastPage: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, lastPage, onChange }: PaginationProps) {
  if (lastPage <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Previous
      </button>
      <span>
        Page {page} of {lastPage}
      </span>
      <button type="button" className="button" disabled={page >= lastPage} onClick={() => onChange(page + 1)}>
        Next →
      </button>
    </nav>
  );
}
