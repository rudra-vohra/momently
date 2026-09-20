/**
 * SelectionBar — Floating bottom action bar when photos are selected
 * Admin-only per Stitch design specs
 */
export default function SelectionBar({
  selectedCount = 0,
  onSelectAll,
  onClear,
  onRemove,
}) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-24 sm:bottom-20 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto z-40 animate-fade-in">
      <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 bg-[#FFF2DB] px-4 sm:px-6 py-2.5 rounded-full shadow-[0_12px_36px_rgba(60,30,10,0.18)] border border-[#F6D2B2]">
        <span className="font-headline-sm text-xs sm:text-sm font-bold text-[#1A1817] whitespace-nowrap">
          {selectedCount} selected
        </span>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onSelectAll}
            className="font-label-sm text-xs sm:text-sm text-[#68625D] hover:text-primary transition-colors whitespace-nowrap"
          >
            Select all in view
          </button>
          <button
            type="button"
            onClick={onClear}
            className="font-label-sm text-xs sm:text-sm text-[#68625D] hover:text-primary transition-colors whitespace-nowrap"
          >
            Clear
          </button>
          <span className="w-px h-3.5 bg-[#EBE3D5]" />
          <button
            type="button"
            onClick={onRemove}
            className="font-label-sm text-xs sm:text-sm text-primary hover:text-primary-hover font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  )
}
