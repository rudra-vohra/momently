import { useNavigate } from 'react-router-dom'

/**
 * NewEventCard — Admin-only "New Event" card using pure Tailwind CSS utility classes
 */
export default function NewEventCard({ onClick }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate('/events/1')
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
      className="group cursor-pointer flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl border-2 border-dashed border-[#d8b88d] bg-[#FFF2DB]/60 hover:bg-[#FFECC9] hover:border-[#F62440] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-5px_rgba(246,36,64,0.12)] min-h-[270px] sm:min-h-[290px] text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F62440]"
    >
      {/* Plus icon bubble with Tailwind group-hover transitions */}
      <div className="w-12 h-12 rounded-xl bg-[#FFE5BF] text-[#bb0028] group-hover:bg-[#F62440] group-hover:text-white group-hover:scale-105 flex items-center justify-center mb-3.5 shadow-xs transition-all duration-200">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>

      <h3 className="font-heading font-bold text-base sm:text-lg text-[#1A1817] group-hover:text-[#F62440] transition-colors mb-1">
        New Event
      </h3>
      <p className="text-xs text-[#68625D] max-w-[190px] leading-relaxed">
        Create a fresh gallery, invite team shooters, and prepare client delivery
      </p>
      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#bb0028] transition-colors duration-200 hover:text-[#F62440] group-hover:underline group-hover:text-[#F62440]">
        <span>Get started</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}
