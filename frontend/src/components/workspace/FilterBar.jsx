/**
 * FilterBar — Momently Event Workspace Filter Strip
 * Sticky toolbar with filter chips, view mode toggle, and crimson Upload button
 * Matches Stitch Event Workspace design exactly
 */
export default function FilterBar({
  activeFilter = 'all',
  onFilterChange,
  totalCount = 142,
  myUploadsCount = 30,
  selectedCount = 12,
  viewMode = 'grid',
  onViewModeChange,
  onUploadClick,
  isAdmin = true,
}) {
  return (
    <div className="sticky top-16 z-30 bg-[#FFFAF3]/95 backdrop-blur-md py-2 mb-5">
      <div className="w-full bg-[#FFF2DB] rounded-3xl sm:rounded-full px-3.5 sm:px-5 py-2.5 flex items-center justify-between border border-[#F6D2B2] shadow-xs gap-3">
        {/* Filter chips scrollable area on mobile */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar flex-nowrap py-0.5">
          {/* All filter */}
          <button
            type="button"
            onClick={() => onFilterChange?.('all')}
            className={`flex-shrink-0 font-label-md px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs sm:text-sm font-semibold transition-all shadow-xs ${
              activeFilter === 'all'
                ? 'bg-[#FFE5BF] text-primary border border-outline-variant/30'
                : 'text-[#6B5E59] hover:text-[#2C1810] hover:bg-white/40'
            }`}
          >
            {activeFilter === 'all' && (
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            )}
            <span>All</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                activeFilter === 'all'
                  ? 'bg-primary-fixed text-primary'
                  : 'bg-[#FDE2CA] text-[#6B5E59]'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* My uploads */}
          <button
            type="button"
            onClick={() => onFilterChange?.('my_uploads')}
            className={`flex-shrink-0 font-label-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all ${
              activeFilter === 'my_uploads'
                ? 'bg-[#FFE5BF] text-primary border border-outline-variant/30 shadow-xs'
                : 'text-[#6B5E59] hover:text-[#2C1810] hover:bg-white/40'
            }`}
          >
            <span className="material-symbols-outlined text-base">person</span>
            <span>My uploads</span>
            <span className="bg-[#FDE2CA] text-[#6B5E59] px-2 py-0.5 rounded-full text-xs font-mono font-semibold">
              {myUploadsCount}
            </span>
          </button>

          {/* Selected (Admin only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onFilterChange?.('selected')}
              className={`flex-shrink-0 font-label-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all ${
                activeFilter === 'selected'
                  ? 'bg-[#FFE5BF] text-primary border border-outline-variant/30 shadow-xs'
                  : 'text-[#6B5E59] hover:text-[#2C1810] hover:bg-white/40'
              }`}
            >
              <span>Selected</span>
              <span className="bg-[#FDE2CA] text-[#6B5E59] px-2 py-0.5 rounded-full text-xs font-mono font-semibold">
                {selectedCount}
              </span>
            </button>
          )}

          <span className="h-4 w-px bg-[#EBE3D5] mx-1 flex-shrink-0" />

          {/* View toggles */}
          <div className="flex items-center gap-1 text-[#6B5E59] flex-shrink-0">
            <button
              type="button"
              title="Grid View"
              onClick={() => onViewModeChange?.('grid')}
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#FDE2CA] text-[#2C1810]'
                  : 'hover:bg-[#FDE2CA]/60 hover:text-[#2C1810]'
              }`}
            >
              <span className="material-symbols-outlined text-lg leading-none">grid_view</span>
            </button>
          </div>
        </div>

        {/* Solid Crimson Upload button */}
        <button
          type="button"
          onClick={onUploadClick}
          className="flex-shrink-0 bg-[#BB0028] hover:bg-[#F62440] text-white font-label-md px-4 sm:px-5 py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm font-semibold shadow-sm transition-all hover:shadow-[0_4px_12px_rgba(246,36,64,0.25)] active:scale-95"
        >
          <span className="material-symbols-outlined text-base sm:text-lg leading-none">cloud_upload</span>
          <span>Upload</span>
        </button>
      </div>
    </div>
  )
}
