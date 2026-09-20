import { useNavigate } from 'react-router-dom'

/**
 * EventCard — Dashboard event card using pure Tailwind CSS utility classes
 */
export default function EventCard({ event }) {
  const navigate = useNavigate()
  const {
    id,
    name,
    coverImage,
    fallbackImage,
    totalPhotos,
    selectedPhotos,
    status, // 'published' | 'draft'
    timestamp,
    actionLabel, // 'View Gallery' | 'Curate'
  } = event

  const handleCardClick = () => {
    navigate(`/events/${id}`)
  }

  return (
    <article
      onClick={handleCardClick}
      className="group bg-[#FFF2DB] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(180,110,50,0.06)] border border-[#FFE5BF]/70 hover:-translate-y-1 hover:shadow-[0_12px_24px_-6px_rgba(180,110,50,0.15)] flex flex-col cursor-pointer transition-all duration-250 ease-out"
    >
      {/* Cover Photo Thumbnail */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#FFE5BF]/40">
        {coverImage && (
          <img
            src={coverImage}
            alt={`${name} cover photo`}
            onError={(e) => {
              if (fallbackImage && e.currentTarget.src !== fallbackImage) {
                e.currentTarget.src = fallbackImage
              } else {
                e.currentTarget.style.display = 'none'
              }
            }}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        )}
        {/* Status Badge on Top Corner */}
        <div className="absolute top-2.5 right-2.5">
          {status === 'published' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-[#DCFCE7] text-[#166534] shadow-xs backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-[#FFE5BF] text-[#854d0e] shadow-xs backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
              Draft
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-4.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-heading font-bold text-base sm:text-base text-[#1A1817] group-hover:text-[#F62440] transition-colors leading-snug">
            {name}
          </h3>
          <p className="font-mono text-[11px] text-[#68625D] mt-1 tracking-tight">
            {totalPhotos} photos · {selectedPhotos} selected
          </p>
        </div>

        {/* Card Footer Metadata */}
        <div className="mt-3.5 pt-2.5 border-t border-[#FFE5BF]/80 flex items-center justify-between text-[11px] text-[#68625D]">
          <span>{timestamp}</span>
          <span className="font-semibold text-[#bb0028] group-hover:text-[#F62440] group-hover:translate-x-0.5 transition-all flex items-center gap-1 text-xs">
            {actionLabel}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </article>
  )
}
