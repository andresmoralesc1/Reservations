"use client"

import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  showFirstLast?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showFirstLast = true
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-[#A0A0A0] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          &laquo;
        </button>
      )}

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-[#A0A0A0] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        &lsaquo;
      </button>

      {getPageNumbers().map((page, index) => (
        page === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 font-sans text-sm text-[#666666]"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={cn(
              "min-w-[40px] px-3 py-2 font-display text-sm uppercase tracking-wider transition-all border rounded-lg",
              currentPage === page
                ? "bg-[#D4A84B] text-black border-[#D4A84B]"
                : "bg-transparent text-[#A0A0A0] border-transparent hover:border-[#333333] hover:text-white"
            )}
          >
            {page}
          </button>
        )
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-[#A0A0A0] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        &rsaquo;
      </button>

      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-[#A0A0A0] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          &raquo;
        </button>
      )}
    </div>
  )
}
