'use client';

import React, { useMemo, useState, useEffect } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  totalItems = 0,
}) => {
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const paginationInfo = useMemo(() => {
    const start = currentPage * itemsPerPage + 1;
    const end = Math.min((currentPage + 1) * itemsPerPage, totalItems);
    return { start, end };
  }, [currentPage, itemsPerPage, totalItems]);

  const paginationButtons = useMemo(() => {
    const buttons: React.ReactNode[] = [];
    const maxVisibleButtons = windowWidth < 768 ? 3 : 5;
    
    const showFirstLastButtons = totalPages > maxVisibleButtons;

    // First Page
    if (showFirstLastButtons && currentPage > 1) {
      buttons.push(
        <button
          key="first"
          onClick={() => onPageChange(0)}
          className="px-2.5 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          aria-label="First page"
        >
          &laquo;
        </button>
      );
    }

    // Previous
    buttons.push(
      <button
        key="prev"
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="px-2.5 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        &lt;
      </button>
    );

    // Page Numbers
    let startPage = Math.max(0, currentPage - Math.floor(maxVisibleButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxVisibleButtons);

    if (endPage - startPage < maxVisibleButtons) {
      startPage = Math.max(0, endPage - maxVisibleButtons);
    }

    for (let i = startPage; i < endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          aria-label={`Page ${i + 1}`}
          aria-current={currentPage === i ? 'page' : undefined}
        >
          {i + 1}
        </button>
      );
    }

    // Next
    buttons.push(
      <button
        key="next"
        onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        disabled={currentPage === totalPages - 1}
        className="px-2.5 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        &gt;
      </button>
    );

    // Last Page
    if (showFirstLastButtons && currentPage < totalPages - 2) {
      buttons.push(
        <button
          key="last"
          onClick={() => onPageChange(totalPages - 1)}
          className="px-2.5 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          aria-label="Last page"
        >
          &raquo;
        </button>
      );
    }

    return buttons;
  }, [currentPage, totalPages, onPageChange, windowWidth]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-4 mt-6 bg-white p-4 shadow-sm border border-gray-300 rounded-lg w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 text-sm text-gray-700">
        <div className="whitespace-nowrap text-xs md:text-sm">
          {totalItems > 0 ? (
            <>
              Menampilkan <span className="font-semibold">{paginationInfo.start}</span> to{' '}
              <span className="font-semibold">{paginationInfo.end}</span> dari{' '}
              <span className="font-semibold">{totalItems}</span> entri
            </>
          ) : (
            'Tidak ada entri ditemukan'
          )}
        </div>

        <nav aria-label="Pagination" className="flex gap-1 flex-wrap justify-center">
          {paginationButtons}
        </nav>
      </div>
    </div>
  );
};

export default Pagination;