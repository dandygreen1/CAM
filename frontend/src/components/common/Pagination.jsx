import React from 'react';

export default function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
      <button onClick={() => onPageChange(0)} disabled={page === 0}>
        «
      </button>
      <button
        onClick={() => onPageChange(p => Math.max(0, p - 1))}
        disabled={page === 0}
      >
        ‹
      </button>
      <span>
        Página {page + 1} de {totalPages}
      </span>
      <button
        onClick={() => onPageChange(p => Math.min(totalPages - 1, p + 1))}
        disabled={page >= totalPages - 1}
      >
        ›
      </button>
      <button
        onClick={() => onPageChange(totalPages - 1)}
        disabled={page >= totalPages - 1}
      >
        »
      </button>
    </div>
  );
}
