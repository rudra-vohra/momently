import { useState } from 'react'

/**
 * UploadDrawer — Collapsible floating upload progress drawer
 * Matches Stitch event workspace upload tray design
 */
export default function UploadDrawer({
  isUploading = true,
  currentCount = 8,
  totalCount = 20,
  progress = 62,
  items = [
    { name: 'DSC_8940.NEF', status: 'Uploading' },
    { name: 'DSC_8941.NEF', status: 'Queued' },
    { name: 'DSC_8942.NEF', status: 'Queued' },
  ],
  onClose,
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isUploading) return null

  return (
    <aside className="fixed bottom-36 sm:bottom-20 right-3 sm:right-6 left-3 sm:left-auto sm:w-80 md:w-88 z-40 bg-[#FFF2DB] rounded-2xl shadow-[0_16px_40px_-8px_rgba(60,30,10,0.16)] border border-[#F6D2B2] p-3.5 transition-all duration-300 animate-fade-in">
      {/* Header / Clickable Toggle */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#BB0028] animate-pulse" />
          <span className="font-label-sm text-xs sm:text-sm font-semibold text-[#1A1817]">
            Uploading {currentCount} of {totalCount} · {progress}%
          </span>
        </div>
        <button
          type="button"
          aria-label="Toggle upload drawer"
          className="text-[#68625D] hover:text-[#1A1817] flex items-center p-1 rounded-full hover:bg-[#FFE5BF]/60 transition-colors"
        >
          <span
            className={`material-symbols-outlined text-lg transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-[#FDE2CA] rounded-full overflow-hidden mt-2.5">
        <div
          className="h-full bg-[#BB0028] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Tray Details Drawer (Collapsible) */}
      {isExpanded && (
        <div className="mt-3 pt-2 text-xs text-[#68625D] flex flex-col gap-1.5 border-t border-[#F6D2B2]/60 animate-fade-in">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between font-metadata-badge text-[11px] font-mono">
              <span className="truncate pr-2 text-[#1A1817]">{item.name}</span>
              <span
                className={
                  item.status === 'Uploading'
                    ? 'text-primary font-semibold'
                    : 'text-[#68625D]'
                }
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
