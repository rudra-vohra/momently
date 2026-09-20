/**
 * PhotoGrid — Momently Event Workspace Photo Grid
 * Supports Admin view (with selection rings, checkboxes, and filename overlays)
 * and Team Member view (clean preview tiles with click-to-preview and "You" pills)
 * Matches Stitch specs exactly: 2 cols on mobile, 3 on sm, 4 on md, 6 on lg
 */
export default function PhotoGrid({
  photos = [],
  selectedIds = [],
  onToggleSelect,
  onPhotoClick,
  isAdmin = true,
}) {
  return (
    <section className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
        {photos.map((photo) => {
          const isSelected = selectedIds.includes(photo.id)

          if (isAdmin) {
            return (
              <article
                key={photo.id}
                onClick={() => onToggleSelect?.(photo.id)}
                className={`group relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] bg-[#FFF2DB] p-1 cursor-pointer ${
                  isSelected ? 'ring-2 ring-[#BB0028]' : ''
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.title || photo.filename || 'Event photo'}
                  className="w-full h-full object-cover rounded-xl"
                  loading="lazy"
                />

                {/* Checkbox button */}
                <div
                  className={`absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#BB0028] text-white shadow-md'
                      : 'bg-black/25 backdrop-blur-sm group-hover:bg-white/90 text-transparent group-hover:text-[#1A1817]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-sm font-bold ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    check
                  </span>
                </div>

                {/* Uploader "You" Pill */}
                {photo.isYours && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="bg-black/50 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      You
                    </span>
                  </div>
                )}

                {/* Hover Gradient Overlay with RAW Filename */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none flex items-end p-2.5">
                  <span className="font-mono text-[11px] text-white drop-shadow">
                    {photo.filename}
                  </span>
                </div>
              </article>
            )
          }

          {/* Team Member Tile: Click opens lightbox preview */}
          return (
            <div
              key={photo.id}
              onClick={() => onPhotoClick?.(photo)}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#FFF2DB] shadow-xs cursor-pointer transition duration-200 hover:scale-[1.02] hover:shadow-md p-1"
            >
              <img
                src={photo.url}
                alt={photo.title || photo.filename || 'Event photo'}
                className="w-full h-full object-cover rounded-xl select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Uploader "You" Pill */}
              {photo.isYours && (
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="bg-black/50 backdrop-blur-md text-white text-[11px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    You
                  </span>
                </div>
              )}

              {/* Hover Overlay with Filename and Title */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 rounded-xl">
                <span className="text-[11px] text-white/90 font-mono">
                  {photo.filename}
                </span>
                {photo.title && (
                  <span className="text-xs text-white font-medium truncate">
                    {photo.title}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
