import { useState, useEffect, useRef, useCallback } from 'react'
import useModalAnimation from '../../hooks/useModalAnimation'

/**
 * TeamModal — Matches Stitch "momently_team_modal" exactly
 * Member roster with admin lock, member removal, and add-by-email form.
 * Features smooth fade/translate enter and exit animations for team member rows.
 *
 * State management strategy:
 *  - New member IDs are tracked via a ref (newMemberIdsRef) that is updated
 *    synchronously during render so the animation class is applied from the
 *    very first render of the new member row (no two-phase flicker).
 *  - Removed members are kept in a local "exitingMembers" map so they remain
 *    mounted during their exit animation. After the animation completes, they
 *    are removed from the DOM.
 */
export default function TeamModal({
  isOpen,
  onClose,
  eventName = 'Event Workspace',
  adminUser,
  teamMembers = [],
  onAddMember,
  onRemoveMember,
}) {
  const [emailInput, setEmailInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [error, setError] = useState(null)
  const [isErrorFading, setIsErrorFading] = useState(false)

  // Members currently exiting (kept mounted for animation).
  // Map: memberId -> member data snapshot
  const [exitingMembers, setExitingMembers] = useState(new Map())

  // Ref-based tracking for newly added member IDs (avoids two-phase render).
  // This is a Set of IDs that are "new" and should get the enter animation.
  const newMemberIdsRef = useRef(new Set())

  // Track the previous set of member IDs from props so we can detect additions.
  const prevPropIdsRef = useRef(new Set())

  // Whether the modal was previously open.
  const prevIsOpenRef = useRef(isOpen)

  const rosterEndRef = useRef(null)

  const { isMounted, isExiting, triggerClose } = useModalAnimation(isOpen, onClose, 200)

  // ──────────────────────────────────────────────────────────────────────────
  // Escape key handler
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMounted && !isExiting && !isSubmitting) {
        triggerClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMounted, isExiting, isSubmitting, triggerClose])

  // ──────────────────────────────────────────────────────────────────────────
  // Reset state when modal opens
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Modal just opened — snapshot the current member IDs.
      prevPropIdsRef.current = new Set(teamMembers.map((m) => m.id))
      newMemberIdsRef.current = new Set()
      setExitingMembers(new Map())
      setError(null)
      setIsErrorFading(false)
      setRemovingId(null)
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // Detect new members added via props (synchronous during render)
  // ──────────────────────────────────────────────────────────────────────────
  // We do this DURING render (not in useEffect) so the animation class is
  // applied on the very first render of the new member row.
  if (isOpen) {
    const currentPropIds = new Set(teamMembers.map((m) => m.id))
    for (const id of currentPropIds) {
      if (!prevPropIdsRef.current.has(id)) {
        newMemberIdsRef.current.add(id)
      }
    }
    // Also clean up: if a member was in "exiting" but reappeared in props, cancel exit.
    // (Unlikely but defensive.)
    if (exitingMembers.size > 0) {
      for (const id of currentPropIds) {
        if (exitingMembers.has(id)) {
          setExitingMembers((prev) => {
            const next = new Map(prev)
            next.delete(id)
            return next
          })
        }
      }
    }
    prevPropIdsRef.current = currentPropIds
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Auto-scroll when new members appear
  // ──────────────────────────────────────────────────────────────────────────
  const prevMemberCountRef = useRef(teamMembers.length)
  useEffect(() => {
    if (isOpen && teamMembers.length > prevMemberCountRef.current) {
      setTimeout(() => {
        rosterEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 60)
    }
    prevMemberCountRef.current = teamMembers.length
  }, [teamMembers.length, isOpen])

  // ──────────────────────────────────────────────────────────────────────────
  // Auto-fade error message after 2.5 seconds
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!error) {
      setIsErrorFading(false)
      return
    }

    setIsErrorFading(false)

    // Begin smooth fade-out at 2.5s
    const fadeTimer = setTimeout(() => {
      setIsErrorFading(true)
    }, 2500)

    // Completely clear error state after fade transition finishes (2.5s + 0.4s = 2.9s)
    const clearTimer = setTimeout(() => {
      setError(null)
      setIsErrorFading(false)
    }, 2900)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(clearTimer)
    }
  }, [error])

  if (!isMounted) return null

  // ──────────────────────────────────────────────────────────────────────────
  // Add member handler
  // ──────────────────────────────────────────────────────────────────────────
  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!emailInput.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onAddMember?.(emailInput.trim())
      setEmailInput('')
    } catch (err) {
      setError(err.message || 'Failed to add team member.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Remove member handler
  // ──────────────────────────────────────────────────────────────────────────
  const handleRemoveMember = async (member) => {
    if (removingId || exitingMembers.has(member.id)) return
    setRemovingId(member.id)
    setError(null)

    // Snapshot the member into exitingMembers BEFORE calling the API.
    // This ensures the row stays mounted with the exit animation class even
    // after the parent removes it from the teamMembers prop.
    setExitingMembers((prev) => new Map(prev).set(member.id, { ...member }))

    try {
      await onRemoveMember?.(member.id)
      // API succeeded — the parent will remove this member from the prop.
      // Wait for the exit animation to finish, then clean up.
      setTimeout(() => {
        setExitingMembers((prev) => {
          const next = new Map(prev)
          next.delete(member.id)
          return next
        })
      }, 250) // slightly longer than the 220ms exit animation
    } catch (err) {
      // Removal failed — cancel the exit animation and restore the member.
      setExitingMembers((prev) => {
        const next = new Map(prev)
        next.delete(member.id)
        return next
      })
      setError(err.message || 'Failed to remove team member.')
    } finally {
      setRemovingId(null)
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Build the rendered member list
  // ──────────────────────────────────────────────────────────────────────────
  const buildMemberRow = (m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.isCreator ? 'Admin' : 'Member',
    initials:
      m.name
        ?.split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || (m.isCreator ? 'AD' : 'TM'),
    photosCount: m.photosCount ?? 0,
    isCreator: !!m.isCreator,
    color: m.isCreator ? 'bg-[#F62440] text-white' : 'bg-[#FFE5BF] text-[#1A1817]',
  })

  // Admin row (always first)
  const adminRows = adminUser
    ? [buildMemberRow({ ...adminUser, isCreator: true })]
    : []

  // Active team member rows (from props, excluding those currently exiting)
  const activeRows = teamMembers
    .filter((m) => !exitingMembers.has(m.id))
    .map((m) => buildMemberRow(m))

  // Exiting member rows (kept mounted for exit animation)
  const exitingRows = Array.from(exitingMembers.values()).map((m) =>
    buildMemberRow(m)
  )

  // Combined: admin + active members + exiting members (exiting at end so they
  // animate out in place)
  const allMembers = [...adminRows, ...activeRows, ...exitingRows]

  // Live count: exclude exiting members
  const liveCount = adminRows.length + activeRows.length

  // Handler for animation end — clear newMemberIds entry after enter animation
  const handleAnimationEnd = (memberId) => {
    newMemberIdsRef.current.delete(memberId)
  }

  return (
    <div
      className={`fixed inset-0 bg-[#1A1817]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto ${
        isExiting ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExiting && !isSubmitting) triggerClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-xl bg-[#FFF2DB] rounded-[20px] shadow-2xl shadow-black/20 p-6 sm:p-8 my-auto ${
          isExiting ? 'animate-modal-pop-out' : 'animate-modal-pop-in'
        }`}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={triggerClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 sm:top-6 sm:right-6 text-[#645c58] hover:text-[#1A1817] hover:bg-[#FFE5BF]/60 p-2 rounded-full transition-all flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Modal Header */}
        <div className="pr-10">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#1A1817] tracking-tight">
            Team · {eventName}
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F62440]" />
            <p className="text-xs sm:text-sm text-[#7a726e]">
              {liveCount}{' '}
              {liveCount === 1
                ? 'collaborator'
                : 'collaborators'}{' '}
              with access to this event
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className={`mt-4 px-3.5 py-2.5 rounded-xl bg-[#ffdad8]/70 border border-[#ba1a1a]/20 flex items-center gap-2.5 text-left transition-all duration-400 ease-out ${
              isErrorFading
                ? 'opacity-0 -translate-y-1 scale-[0.98]'
                : 'opacity-100 translate-y-0 scale-100'
            }`}
          >
            <span className="material-symbols-outlined text-[#ba1a1a] text-lg select-none shrink-0 flex items-center justify-center">
              error
            </span>
            <p className="font-body text-xs sm:text-[13px] text-[#ba1a1a] leading-tight flex-1 font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Member Roster List */}
        <div className="mt-6 space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {allMembers.map((member) => {
            const memberIsExiting = exitingMembers.has(member.id)
            const memberIsNew = newMemberIdsRef.current.has(member.id)

            return (
              <div
                key={member.id}
                className={
                  memberIsExiting
                    ? 'animate-member-pop-out'
                    : memberIsNew
                    ? 'animate-member-pop-in'
                    : ''
                }
                onAnimationEnd={() => {
                  if (memberIsNew) handleAnimationEnd(member.id)
                }}
              >
                <div
                  className={`flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl hover:bg-[#FFE5BF]/40 transition-colors group ${
                    memberIsNew && !memberIsExiting ? 'bg-[#FFE5BF]/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${member.color}`}
                    >
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-bold text-[#1A1817] truncate">
                          {member.name}
                        </span>
                        {member.isCreator ? (
                          <span className="bg-[#F62440] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full leading-tight shadow-sm">
                            Admin
                          </span>
                        ) : (
                          <span className="bg-[#FFE5BF] text-[#1A1817] text-[11px] font-semibold px-2.5 py-0.5 rounded-full leading-tight shadow-sm">
                            Member
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#7a726e] truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-[#7a726e] bg-[#FFE5BF] px-2.5 py-1 rounded-md">
                      {member.photosCount} photos
                    </span>

                    {member.isCreator ? (
                      <div
                        className="w-8 h-8 flex items-center justify-center text-[#7a726e]/60"
                        title="Event Creator · Cannot be removed"
                      >
                        <span className="material-symbols-outlined text-base">lock</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={removingId === member.id || memberIsExiting}
                        onClick={() => handleRemoveMember(member)}
                        aria-label={`Remove ${member.name}`}
                        title={`Remove ${member.name}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#F62440]/70 hover:text-[#F62440] hover:bg-[#F62440]/10 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {removingId === member.id ? (
                          <span className="material-symbols-outlined text-sm animate-spin">
                            progress_activity
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-lg">person_remove</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={rosterEndRef} />
        </div>

        {/* Divider */}
        <div className="h-px bg-[#FFE5BF] my-6" />

        {/* Add Member Form Section */}
        <div className="flex flex-col">
          <label
            htmlFor="new-member-email"
            className="text-xs sm:text-sm font-semibold text-[#1A1817]"
          >
            Add by email
          </label>
          <form
            onSubmit={handleAddMember}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2"
          >
            <div className="relative flex-1">
              <input
                id="new-member-email"
                type="email"
                required
                placeholder="team.member@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-[#FFE5BF]/70 hover:bg-[#FFE5BF] focus:bg-[#FFE5BF] text-[#1A1817] rounded-xl px-3.5 py-2.5 text-sm outline-none shadow-inner placeholder:text-[#9e9690] transition-all focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shrink-0 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">
                    progress_activity
                  </span>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>Add</span>
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-[#7a726e] mt-2.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#7a726e]">info</span>
            <span>They must already have an active Momently studio account.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
