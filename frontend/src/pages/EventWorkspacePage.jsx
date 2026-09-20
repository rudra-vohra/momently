import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { eventsService, photosService, galleriesService } from '../services/api'
import logoSrc from '../assets/images/momently-logo.png'
import TeamModal from '../components/modals/TeamModal'
import PublishModal from '../components/modals/PublishModal'
import GallerySettingsModal from '../components/modals/GallerySettingsModal'
import ChangePinModal from '../components/modals/ChangePinModal'
import GalleryPublishedModal from '../components/modals/GalleryPublishedModal'
import DeleteEventModal from '../components/modals/DeleteEventModal'
import DeletePhotosModal from '../components/modals/DeletePhotosModal'
import PublishRequirementModal from '../components/modals/PublishRequirementModal'
import UnpublishGalleryModal from '../components/modals/UnpublishGalleryModal'
import SnapshotUpdatedModal from '../components/modals/SnapshotUpdatedModal'
import ActionErrorModal from '../components/modals/ActionErrorModal'

export default function EventWorkspacePage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user, token, isAdmin: authIsAdmin, isLoading: authLoading, logout } = useAuth()

  // Real backend data states
  const [eventData, setEventData] = useState(null)
  const [photos, setPhotos] = useState([])
  const [gallery, setGallery] = useState(null)
  const [publishedPhotos, setPublishedPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Profile dropdown menu state
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const isLoggingOutRef = useRef(false)

  // Filter & view mode states
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const [isPreviewClosing, setIsPreviewClosing] = useState(false)
  const previewCloseTimerRef = useRef(null)

  const handleOpenPreview = (photo) => {
    if (previewCloseTimerRef.current) clearTimeout(previewCloseTimerRef.current)
    setIsPreviewClosing(false)
    setPreviewPhoto(photo)
  }

  const handleClosePreview = () => {
    if (isPreviewClosing || !previewPhoto) return
    setIsPreviewClosing(true)
    if (previewCloseTimerRef.current) clearTimeout(previewCloseTimerRef.current)
    previewCloseTimerRef.current = setTimeout(() => {
      setPreviewPhoto(null)
      setIsPreviewClosing(false)
    }, 200)
  }

  // Handle Escape key to close photo preview smoothly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && previewPhoto && !isPreviewClosing) {
        handleClosePreview()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewPhoto, isPreviewClosing])

  // Cleanup preview close timer on unmount
  useEffect(() => {
    return () => {
      if (previewCloseTimerRef.current) clearTimeout(previewCloseTimerRef.current)
    }
  }, [])

  // Upload Tray states
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadState, setUploadState] = useState('idle') // 'idle' | 'uploading' | 'success' | 'partial' | 'error'
  const [uploadProgress, setUploadProgress] = useState(null) // { total, current, percent, filename, message, failedFiles }
  const [isUploadTrayMinimized, setIsUploadTrayMinimized] = useState(false)
  const [isUploadTrayVisible, setIsUploadTrayVisible] = useState(false)

  // Modals state (Admin only)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [gallerySettingsOpen, setGallerySettingsOpen] = useState(false)
  const [changePinOpen, setChangePinOpen] = useState(false)
  const [galleryPublishedOpen, setGalleryPublishedOpen] = useState(false)
  const [deleteEventModalOpen, setDeleteEventModalOpen] = useState(false)
  const [deletePhotosModalOpen, setDeletePhotosModalOpen] = useState(false)
  const [isDeletingPhotos, setIsDeletingPhotos] = useState(false)
  const [publishRequirementModalOpen, setPublishRequirementModalOpen] = useState(false)
  const [unpublishModalOpen, setUnpublishModalOpen] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  const [snapshotUpdatedModalOpen, setSnapshotUpdatedModalOpen] = useState(false)
  const [isUpdatingSnapshot, setIsUpdatingSnapshot] = useState(false)
  const [errorModalState, setErrorModalState] = useState({ isOpen: false, title: '', message: '' })
  const [isSettingCover, setIsSettingCover] = useState(false)
  const [coverUpdateSuccess, setCoverUpdateSuccess] = useState('')
  const [lastUsedPin, setLastUsedPin] = useState('4829')

  // Back navigation slide transition state
  const [isNavigatingBack, setIsNavigatingBack] = useState(false)

  const handleBackToDashboard = (e) => {
    if (e) e.preventDefault()
    if (isNavigatingBack) return
    setIsNavigatingBack(true)

    // Smooth exit transition before navigating
    setTimeout(() => {
      navigate('/dashboard')
    }, 220)
  }

  const showErrorModal = (message, title = 'Action Failed') => {
    setErrorModalState({ isOpen: true, title, message })
  }

  // Handle outside clicks to close profile menu
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleLogout = () => {
    isLoggingOutRef.current = true
    logout()
    navigate('/', { replace: true })
  }

  // Redirect to /login if token is missing and auth check completed
  useEffect(() => {
    if (!authLoading && !token && !isLoggingOutRef.current) {
      navigate('/login')
    }
  }, [authLoading, token, navigate])

  // Load Event, Photos, and Gallery data
  const loadWorkspaceData = async () => {
    if (!token || !eventId) return
    setIsLoading(true)
    setLoadError(null)

    try {
      // 1. Fetch Event details
      const eventDetails = await eventsService.getEvent(eventId)
      setEventData(eventDetails)

      // 2. Fetch Photos
      const photosData = await photosService.getPhotos(eventId)
      setPhotos(photosData || [])

      // 3. Fetch Gallery status (may return 404 if not yet published)
      try {
        const galleryData = await galleriesService.getGallery(eventId)
        setGallery(galleryData)

        // 4. If gallery is published and user is admin, fetch the published snapshot photos in stored order
        if (galleryData?.is_published && (eventDetails?.admin_id === user?.id || user?.role === 'admin')) {
          try {
            const pubPhotos = await galleriesService.getPublishedPhotos(eventId)
            setPublishedPhotos(pubPhotos || [])
          } catch (pubErr) {
            console.warn('Failed to load published snapshot photos:', pubErr)
            setPublishedPhotos([])
          }
        } else {
          setPublishedPhotos([])
        }
      } catch (galleryErr) {
        // 404 means unpublished gallery
        setGallery(null)
        setPublishedPhotos([])
      }
    } catch (err) {
      console.error('Failed to load workspace:', err)
      setLoadError(err.message || 'Unable to load event workspace.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token && eventId) {
      loadWorkspaceData()
    }
  }, [token, eventId])

  // Escape key handler for lightbox modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPreviewPhoto(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Derived metrics
  const eventName = eventData?.name || 'Event Workspace'
  const isCreatorAdmin = eventData?.admin_id === user?.id || user?.role === 'admin'
  const isAdmin = isCreatorAdmin

  // Reset admin-only filter if user is a team member
  useEffect(() => {
    if (!isAdmin && (activeFilter === 'selected' || activeFilter === 'published')) {
      setActiveFilter('all')
    }
  }, [isAdmin, activeFilter])

  const isPublished = gallery?.is_published ?? false

  // Rule 28: Use the published snapshot data from GET /galleries/events/{event_id}/photos
  const publishedSnapshotCount = isPublished ? publishedPhotos.length : 0

  // Published photo IDs set
  const publishedPhotoIds = useMemo(
    () => new Set(publishedPhotos.map((p) => p.id)),
    [publishedPhotos]
  )
  const publishedIdsSet = publishedPhotoIds

  // Locked condition: gallery is currently published AND photo belongs to published snapshot
  const isPhotoPublishedLocked = (photoId) =>
    Boolean(isPublished && publishedPhotoIds.has(photoId))

  const totalPhotosCount = photos.length

  // Selected photos awaiting publication (published photos in snapshot are locked and not in pending selection)
  const selectedPhotos = photos.filter(
    (p) => p.selected_for_gallery && !isPhotoPublishedLocked(p.id)
  )
  const selectedIds = selectedPhotos.map((p) => p.id)
  const selectedCount = selectedIds.length

  // Calculate unpublished changes (newly selected photos awaiting the next snapshot update)
  const unpublishedChangesCount = selectedCount
  const myUploadsCount = photos.filter((p) => p.uploaded_by === user?.id).length

  // Filter photos (supports all, my_uploads, selected, and published snapshot)
  const filteredPhotos = (() => {
    if (activeFilter === 'my_uploads') {
      return photos.filter((photo) => photo.uploaded_by === user?.id)
    }
    if (activeFilter === 'selected' && isAdmin) {
      return selectedPhotos
    }
    if (activeFilter === 'published' && isAdmin && isPublished) {
      // Return published snapshot photos in their stored order, mapped with current selection state
      return publishedPhotos.map((pubPhoto) => {
        const livePhoto = photos.find((p) => p.id === pubPhoto.id)
        return livePhoto || pubPhoto
      })
    }
    return photos
  })()

  // Photos eligible for selection/deselection
  const selectableFilteredPhotos = filteredPhotos.filter(
    (p) => !isPhotoPublishedLocked(p.id)
  )

  // Active selection awaiting publication (excluding published photos)
  const activeSelectedPhotos = selectedPhotos
  const activeSelectedIds = selectedIds
  const activeSelectedCount = selectedCount

  // Deletable selected photos (only unpublished selected photos can be deleted while gallery is live)
  const deletableSelectedPhotos = selectedPhotos
  const deletableSelectedIds = selectedIds
  const deletableSelectedCount = selectedCount

  // Clearable selected photos (only unpublished selected photos can be cleared)
  const clearableSelectedPhotos = selectedPhotos
  const clearableSelectedCount = selectedCount

  // Selection handlers (Admin only)
  const handleToggleSelect = async (photoId) => {
    if (!isAdmin) return
    // Guard: Published photos are locked from selection/deselection
    if (isPhotoPublishedLocked(photoId)) return

    const currentPhoto = photos.find((p) => p.id === photoId)
    if (!currentPhoto) return

    const newSelected = !currentPhoto.selected_for_gallery
    // Optimistic UI update
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, selected_for_gallery: newSelected } : p))
    )

    try {
      await photosService.selectPhotos(eventId, [photoId], newSelected)
    } catch (err) {
      console.error('Failed to update selection:', err)
      // Rollback on failure
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, selected_for_gallery: !newSelected } : p))
      )
    }
  }

  const handleSelectAll = async () => {
    if (!isAdmin) return
    // Only select photos that are not locked in published snapshot
    const idsToSelect = selectableFilteredPhotos
      .filter((p) => !p.selected_for_gallery)
      .map((p) => p.id)
    if (idsToSelect.length === 0) return

    // Optimistic update
    setPhotos((prev) =>
      prev.map((p) => (idsToSelect.includes(p.id) ? { ...p, selected_for_gallery: true } : p))
    )
    try {
      await photosService.selectPhotos(eventId, idsToSelect, true)
    } catch (err) {
      console.error('Failed to select all:', err)
      await loadWorkspaceData()
    }
  }

  const handleClearSelection = async () => {
    if (!isAdmin) return
    // Only deselect photos that are not locked in published snapshot
    const idsToDeselect = clearableSelectedPhotos.map((p) => p.id)
    if (idsToDeselect.length === 0) return

    // Optimistic update
    setPhotos((prev) =>
      prev.map((p) => (idsToDeselect.includes(p.id) ? { ...p, selected_for_gallery: false } : p))
    )
    try {
      await photosService.selectPhotos(eventId, idsToDeselect, false)
    } catch (err) {
      console.error('Failed to clear selection:', err)
      await loadWorkspaceData()
    }
  }

  const handleOpenDeletePhotosModal = () => {
    if (!isAdmin || deletableSelectedCount === 0) return
    setDeletePhotosModalOpen(true)
  }

  const handleConfirmDeletePhotos = async () => {
    if (!isAdmin || deletableSelectedCount === 0) return
    setIsDeletingPhotos(true)

    const idsToDelete = deletableSelectedIds

    try {
      for (const photoId of idsToDelete) {
        // Defensive check: NEVER call DELETE /photos/{photo_id} for a locked published photo!
        if (isPhotoPublishedLocked(photoId)) continue
        await photosService.deletePhoto(photoId)
      }
      setPhotos((prev) => prev.filter((p) => !idsToDelete.includes(p.id)))
      setDeletePhotosModalOpen(false)
    } catch (err) {
      console.error('Failed to delete photos:', err)
      showErrorModal(err.message || 'Failed to delete some photos.', 'Delete Photos Failed')
      await loadWorkspaceData()
    } finally {
      setIsDeletingPhotos(false)
    }
  }

  const handleSetCoverPhoto = async (photoIdToSet) => {
    if (!isAdmin) return
    const photoId = photoIdToSet || (selectedCount === 1 ? selectedIds[0] : null)
    if (!photoId) return

    setIsSettingCover(true)
    try {
      const updatedEvent = await eventsService.setCoverPhoto(eventId, photoId)
      setEventData((prev) => ({
        ...prev,
        cover_image_url: updatedEvent.cover_image_url,
      }))
      setCoverUpdateSuccess('Event cover photo updated successfully!')
      setTimeout(() => setCoverUpdateSuccess(''), 4000)
    } catch (err) {
      console.error('Failed to set cover photo:', err)
      showErrorModal(err.message || 'Failed to update cover photo.', 'Cover Photo Failed')
    } finally {
      setIsSettingCover(false)
    }
  }

  // Upload handler (Multipart/form-data)
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)
    setUploadState('uploading')
    setIsUploadTrayVisible(true)
    setIsUploadTrayMinimized(false)
    setUploadProgress({
      total: files.length,
      current: 0,
      percent: 25,
      filename: `Uploading ${files.length} ${files.length === 1 ? 'photo' : 'photos'}...`,
      message: `Uploading ${files.length} ${files.length === 1 ? 'photo' : 'photos'}...`,
      failedFiles: [],
    })

    try {
      setUploadProgress({
        total: files.length,
        current: files.length,
        percent: 65,
        filename: `Processing ${files.length} ${files.length === 1 ? 'photo' : 'photos'}...`,
        message: `Processing ${files.length} ${files.length === 1 ? 'photo' : 'photos'}...`,
        failedFiles: [],
      })

      // 1. ONE bulk upload request sent to POST /photos/{event_id}
      const result = await photosService.uploadPhotos(eventId, files)
      
      // 2. Consume result.uploaded directly from the successful response
      const uploadedPhotos = Array.isArray(result?.uploaded) ? result.uploaded : []
      const failedList = Array.isArray(result?.failed) ? result.failed : []

      // 3 & 4. Prepend newly uploaded PhotoResponse objects into local state without calling GET /photos/{event_id}
      if (uploadedPhotos.length > 0) {
        setPhotos((prevPhotos) => {
          // 6. Strict deduplication to avoid duplicate photos in local state
          const existingIds = new Set(prevPhotos.map((p) => p?.id).filter(Boolean))
          const freshPhotos = []
          for (const photo of uploadedPhotos) {
            if (photo && photo.id && !existingIds.has(photo.id)) {
              existingIds.add(photo.id)
              freshPhotos.push(photo)
            }
          }
          return [...freshPhotos, ...prevPhotos]
        })

        // If event had no cover photo set yet, set it to the first uploaded photo
        if (!eventData?.cover_image_url && uploadedPhotos[0]?.thumbnail_url) {
          setEventData((prev) =>
            prev ? { ...prev, cover_image_url: uploadedPhotos[0].thumbnail_url } : prev
          )
        }
      }

      if (failedList.length > 0 && uploadedPhotos.length > 0) {
        // Partial success: some uploaded, some failed
        setUploadState('partial')
        setIsUploading(false)
        const msg = `${uploadedPhotos.length} uploaded, ${failedList.length} failed`
        setUploadProgress({
          total: files.length,
          current: uploadedPhotos.length,
          percent: 100,
          filename: msg,
          message: msg,
          failedFiles: failedList,
        })
      } else if (uploadedPhotos.length > 0) {
        // Full success
        setUploadState('success')
        setIsUploading(false)
        const msg = `Uploaded ${uploadedPhotos.length} ${uploadedPhotos.length === 1 ? 'photo' : 'photos'} successfully!`
        setUploadProgress({
          total: files.length,
          current: uploadedPhotos.length,
          percent: 100,
          filename: msg,
          message: msg,
          failedFiles: [],
        })

        // Auto minimize tray after 3.5 seconds
        setTimeout(() => {
          setIsUploadTrayMinimized(true)
        }, 3500)
      } else {
        // Zero uploaded (all failed)
        setUploadState('error')
        setIsUploading(false)
        const msg = failedList.length > 0 ? failedList.join(', ') : 'Upload failed: no valid photos were uploaded.'
        setUploadProgress({
          total: files.length,
          current: 0,
          percent: 0,
          filename: msg,
          message: msg,
          failedFiles: failedList,
        })
      }
    } catch (err) {
      console.error('Upload failed:', err)
      setUploadState('error')
      setIsUploading(false)
      const errorMsg = err.message || 'Failed to fetch'
      setUploadProgress({
        total: files.length,
        current: 0,
        percent: 0,
        filename: `Upload failed: ${errorMsg}`,
        message: `Upload failed: ${errorMsg}`,
        failedFiles: [errorMsg],
      })
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Team Modal Actions
  const handleAddTeamMember = async (email) => {
    await eventsService.addTeamMember(eventId, email)
    const updated = await eventsService.getEvent(eventId)
    setEventData(updated)
  }

  const handleRemoveTeamMember = async (userId) => {
    await eventsService.removeTeamMember(eventId, userId)
    const updated = await eventsService.getEvent(eventId)
    setEventData(updated)
  }

  // Gallery Publish Actions
  const handlePublishGallery = async (pin) => {
    const publishedGallery = await galleriesService.publishGallery(eventId, pin)
    setGallery(publishedGallery)
    try {
      const pubPhotos = await galleriesService.getPublishedPhotos(eventId)
      setPublishedPhotos(pubPhotos || [])
    } catch (pubErr) {
      console.warn('Failed to load published snapshot photos:', pubErr)
    }
    setLastUsedPin(pin)
    if (activeFilter === 'selected') {
      setActiveFilter('published')
    }
    setPublishModalOpen(false)
    setGalleryPublishedOpen(true)
  }

  const handleUpdateSnapshot = async () => {
    if (isUpdatingSnapshot) return
    setIsUpdatingSnapshot(true)
    try {
      const updated = await galleriesService.updateSnapshot(eventId)
      setGallery(updated)
      try {
        const pubPhotos = await galleriesService.getPublishedPhotos(eventId)
        setPublishedPhotos(pubPhotos || [])
      } catch (pubErr) {
        console.warn('Failed to refresh published snapshot photos:', pubErr)
      }
      if (activeFilter === 'selected') {
        setActiveFilter('published')
      }
      setGallerySettingsOpen(false)
      setSnapshotUpdatedModalOpen(true)
    } catch (err) {
      console.error('Failed to update snapshot:', err)
      showErrorModal(err.message || 'Failed to update snapshot.', 'Snapshot Update Failed')
    } finally {
      setIsUpdatingSnapshot(false)
    }
  }

  const handleChangePin = async (newPin) => {
    await galleriesService.updatePin(eventId, newPin)
    setLastUsedPin(newPin)
    setChangePinOpen(false)
    setGallerySettingsOpen(false)
    setGalleryPublishedOpen(true)
  }

  const handleOpenUnpublishModal = () => {
    setGallerySettingsOpen(false)
    setUnpublishModalOpen(true)
  }

  const handleConfirmUnpublish = async () => {
    setIsUnpublishing(true)
    try {
      await galleriesService.unpublishGallery(eventId)
      setGallery((prev) => (prev ? { ...prev, is_published: false } : null))
      setPublishedPhotos([])
      if (activeFilter === 'published') {
        setActiveFilter('all')
      }
      setUnpublishModalOpen(false)
    } catch (err) {
      showErrorModal(err.message || 'Failed to unpublish gallery.', 'Unpublish Failed')
    } finally {
      setIsUnpublishing(false)
    }
  }

  const handleConfirmDeleteEvent = async () => {
    try {
      await eventsService.deleteEvent(eventId)
      const message = `Event "${eventName}" was successfully deleted.`
      sessionStorage.setItem('momently_deleted_message', message)
      setDeleteEventModalOpen(false)
      navigate('/dashboard', { state: { deletedMessage: message }, replace: true })
    } catch (err) {
      showErrorModal(err.message || 'Failed to delete event.', 'Delete Event Failed')
    }
  }

  const userInitials =
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'MO'

  const selectedPhoto = activeSelectedCount === 1 ? photos.find((p) => p.id === activeSelectedIds[0]) : null
  const isCurrentSelectionCover = Boolean(
    selectedPhoto &&
    eventData?.cover_image_url &&
    (selectedPhoto.thumbnail_url === eventData.cover_image_url || selectedPhoto.url === eventData.cover_image_url)
  )

  return (
    <div className="bg-[#FFFAF3] font-body-md text-[#1A1817] antialiased selection:bg-secondary-container selection:text-primary min-h-screen flex flex-col">
      {/* Hidden file input for photo uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*"
        className="hidden"
      />


      {/* 1. BRAND & HEADER */}
      <header className="sticky top-0 w-full z-50 bg-[#FFFAF3]/90 backdrop-blur-md border-b border-[#F6D2B2]/40 shadow-[0_1px_8px_rgba(80,50,20,0.04)]">
        <div className="h-14 sm:h-16 w-full px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <Link
              to="/dashboard"
              aria-label="Momently Home"
              className="flex items-center momently-pop flex-shrink-0"
            >
              <img
                alt="Momently"
                className="h-7 sm:h-8 w-auto object-contain select-none"
                src={logoSrc}
              />
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
              <Link
                to="/dashboard"
                aria-current="page"
                className="transition-colors duration-150 bg-[#FFE5BF] text-[#746243] hover:text-[#1A1817] font-label-md rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm whitespace-nowrap font-medium shadow-xs cursor-pointer"
              >
                Events
              </Link>
              {gallery?.slug && isPublished && (
                <Link
                  to={`/gallery/${gallery.slug}`}
                  target="_blank"
                  className="text-on-surface-variant hover:text-[#1A1817] font-label-md px-3 sm:px-4 py-1 sm:py-1.5 transition-colors text-xs sm:text-sm whitespace-nowrap flex items-center gap-1"
                >
                  <span>Public View</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right: User Avatar & Profile Dropdown */}
          <div className="relative flex items-center" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 rounded-full hover:bg-[#FFF2DB] transition-all cursor-pointer focus:outline-none"
              aria-label="User profile menu"
              aria-expanded={profileMenuOpen}
            >
              <div className="w-8 h-8 rounded-full bg-[#BB0028] text-white font-headline-sm text-xs flex items-center justify-center transition-colors shadow-sm font-bold">
                {userInitials}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="font-label-md text-xs sm:text-sm font-semibold text-[#1A1817] leading-tight">
                  {user?.name || 'Studio User'}
                </span>
                <span className="font-metadata-badge text-[10px] text-[#68625D] tracking-tight">
                  {isAdmin ? 'Studio Admin' : 'Team Member'}
                </span>
              </div>
              <svg
                className={`w-3.5 h-3.5 text-[#68625D] transition-transform duration-200 hidden sm:block ${
                  profileMenuOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-[#FFF2DB] border border-[#F6D2B2]/60 shadow-[0_8px_20px_rgba(60,30,10,0.12)] py-1.5 z-50 animate-fade-in">
                <div className="px-3.5 py-2 border-b border-[#F6D2B2]/40">
                  <p className="font-heading font-bold text-xs text-[#1A1817] truncate">{user?.name || 'Studio User'}</p>
                  <p className="text-[11px] text-[#68625D] truncate">{user?.email || 'user@momently.com'}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase bg-[#FFE5BF] text-[#784A1A]">
                    {isAdmin ? 'Studio Admin' : 'Photographer'}
                  </span>
                </div>

                <div className="p-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-[#bb0028] hover:bg-[#FFE5BF]/80 rounded-lg transition-colors font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main
        className={`w-full flex-1 min-h-screen bg-[#FFFAF3] px-4 sm:px-6 lg:px-8 pb-16 max-w-[1360px] mx-auto ${
          isNavigatingBack ? 'animate-workspace-slide-out pointer-events-none' : ''
        }`}
      >
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-4xl text-[#BB0028] animate-spin mb-3">
              progress_activity
            </span>
            <p className="font-heading font-semibold text-[#1A1817] text-sm">
              Loading event workspace...
            </p>
          </div>
        ) : loadError ? (
          <div className="my-8 p-6 rounded-2xl bg-[#ffdad8]/70 border border-[#ba1a1a]/20 text-[#ba1a1a] flex flex-col items-center text-center max-w-md mx-auto">
            <span className="material-symbols-outlined text-3xl mb-2">error</span>
            <h3 className="font-heading font-bold text-base mb-1">Could not load event</h3>
            <p className="font-body text-xs mb-4">{loadError}</p>
            <Link
              to="/dashboard"
              onClick={handleBackToDashboard}
              className="px-4 py-2 bg-[#ba1a1a] text-white rounded-full text-xs font-semibold hover:bg-[#93000a] transition-all inline-flex items-center gap-1.5 group cursor-pointer active:scale-95"
            >
              <span
                className={`material-symbols-outlined text-sm transition-transform duration-200 ${
                  isNavigatingBack ? '-translate-x-2' : 'group-hover:-translate-x-1'
                }`}
              >
                arrow_back
              </span>
              <span>Back to Events</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            {isAdmin ? (
              /* =========================================================================
                 ADMIN VIEW: BREADCRUMB, TITLE & ADMIN ACTION BAR
                 ========================================================================= */
              <div className="w-full">
                <div className="pt-3 pb-1">
                  <Link
                    to="/dashboard"
                    onClick={handleBackToDashboard}
                    className="inline-flex items-center gap-1 font-body-sm text-xs sm:text-sm text-[#68625D] hover:text-primary transition-colors duration-200 group cursor-pointer"
                  >
                    <span
                      className={`material-symbols-outlined text-sm transition-transform duration-200 ease-out ${
                        isNavigatingBack ? '-translate-x-3 opacity-0' : 'group-hover:-translate-x-1'
                      }`}
                    >
                      arrow_back
                    </span>
                    <span>Events</span>
                  </Link>
                </div>

                {coverUpdateSuccess && (
                  <div className="mb-3 p-3 rounded-xl bg-[#DEF7EC] border border-[#B9ECCE] text-[#03543F] flex items-center justify-between shadow-xs transition-all animate-fadeIn">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                      <span className="material-symbols-outlined text-base text-[#10B981]">check_circle</span>
                      <span>{coverUpdateSuccess}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoverUpdateSuccess('')}
                      className="p-1 text-[#03543F]/70 hover:text-[#03543F] rounded-lg transition-colors cursor-pointer"
                      aria-label="Dismiss notification"
                    >
                      <span className="material-symbols-outlined text-base leading-none">close</span>
                    </button>
                  </div>
                )}

                <div className="py-1 mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Title & Live Metadata */}
                    <div>
                      <h1 className="font-headline-lg text-xl sm:text-2xl lg:text-[1.75rem] text-[#1A1817] font-bold tracking-tight">
                        {eventName}
                      </h1>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-metadata-badge text-[11px] text-[#68625D] mt-1">
                        <span>{totalPhotosCount} photos</span>
                        <span className="text-[#926e6d]/40">·</span>
                        <button
                          type="button"
                          onClick={() => setActiveFilter('selected')}
                          className="hover:text-[#1A1817] transition-colors cursor-pointer"
                        >
                          {selectedCount} selected
                        </button>
                        <span className="text-[#926e6d]/40">·</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (isPublished) setActiveFilter('published')
                          }}
                          className={`inline-flex items-center gap-1 ${
                            isPublished ? 'cursor-pointer hover:opacity-80' : ''
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPublished ? 'bg-[#059669]' : 'bg-[#d97706]'
                            } inline-block`}
                          />
                          <span className="text-[#1A1817]">
                            {isPublished ? `${publishedSnapshotCount} published` : 'Draft'}
                          </span>
                        </button>
                        {isPublished && unpublishedChangesCount > 0 && (
                          <>
                            <span className="text-[#926e6d]/40">·</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#BB0028] inline-block" />
                              <span className="text-primary font-medium">
                                {unpublishedChangesCount} unpublished changes
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons (Admin Only) */}
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      <button
                        onClick={() => setTeamModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF2DB] hover:bg-[#F9DFB9] text-[#1A1817] font-label-md text-xs font-semibold rounded-full transition-all border border-[#F6D2B2]/60 shadow-xs cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base leading-none">group</span>
                        <span>Team</span>
                        {eventData?.team_members?.length > 0 && (
                          <span className="w-4 h-4 rounded-full bg-[#FFE5BF] text-[#784A1A] text-[10px] flex items-center justify-center font-bold">
                            {eventData.team_members.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (isPublished) {
                            setGallerySettingsOpen(true)
                          } else {
                            if (selectedCount === 0) {
                              setPublishRequirementModalOpen(true)
                              return
                            }
                            setPublishModalOpen(true)
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#BB0028] hover:bg-[#F62440] text-white font-label-md text-xs font-semibold rounded-full shadow-sm hover:shadow-[0_4px_14px_rgba(246,36,64,0.28)] transition-all cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base leading-none">
                          {isPublished ? 'settings' : 'publish'}
                        </span>
                        <span>{isPublished ? 'Gallery settings' : 'Publish'}</span>
                      </button>

                      {/* Delete Event Button with just a bin icon */}
                      <button
                        onClick={() => setDeleteEventModalOpen(true)}
                        title="Delete event"
                        aria-label="Delete event"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FFF2DB] hover:bg-[#FFE5BF] text-[#C41C35] hover:text-[#91051D] border border-[#F6D2B2]/60 shadow-xs transition-all active:scale-95 cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px] leading-none">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* =========================================================================
                 TEAM MEMBER VIEW: STREAMLINED HEADER
                 ========================================================================= */
              <section className="w-full pt-3 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 pb-1">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        to="/dashboard"
                        onClick={handleBackToDashboard}
                        className="inline-flex items-center gap-1 text-[#68625D] hover:text-primary font-label-sm text-xs transition-colors duration-200 group cursor-pointer"
                      >
                        <span
                          className={`material-symbols-outlined text-sm transition-transform duration-200 ease-out ${
                            isNavigatingBack ? '-translate-x-3 opacity-0' : 'group-hover:-translate-x-1'
                          }`}
                        >
                          arrow_back
                        </span>
                        <span>Events</span>
                      </Link>
                    </div>
                    <h1 className="font-headline-lg text-[#1A1817] tracking-tight text-xl sm:text-2xl lg:text-[1.75rem] font-bold">
                      {eventName}
                    </h1>
                    <p className="font-metadata-badge text-[11px] text-[#68625D] tracking-wide flex items-center gap-1 font-mono">
                      <span className="text-[#1A1817] font-semibold">{totalPhotosCount} photos</span>
                      <span>·</span>
                      <span>{myUploadsCount} uploaded by you</span>
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 3. TOOLBAR STRIP */}
            <section className="w-full py-1.5 mb-2.5 sticky top-14 sm:top-16 z-30 bg-[#FFFAF3]/95 backdrop-blur-md">
              <div className="w-full bg-[#FFF2DB] rounded-2xl sm:rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between border border-[#F6D2B2]/60 shadow-xs gap-2">
                <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar flex-nowrap py-0.5 min-w-0 flex-1">
                  {/* All Filter */}
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className={`group inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full font-label-md text-xs font-semibold transition-all shadow-xs flex-shrink-0 cursor-pointer ${
                      activeFilter === 'all'
                        ? 'bg-[#FFE5BF] text-[#BB0028]'
                        : 'bg-transparent hover:bg-[#FFE5BF]/60 text-[#1A1817]'
                    }`}
                  >
                    {activeFilter === 'all' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BB0028]" />
                    )}
                    <span>All</span>
                    <span
                      className={`font-metadata-badge text-[11px] font-mono ${
                        activeFilter === 'all'
                          ? 'opacity-90'
                          : 'px-1.5 py-0.2 rounded-full bg-[#FFE5BF] text-[#746243]'
                      }`}
                    >
                      {totalPhotosCount}
                    </span>
                  </button>

                  {/* My Uploads */}
                  <button
                    type="button"
                    onClick={() => setActiveFilter('my_uploads')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full font-label-md text-xs transition-all flex-shrink-0 cursor-pointer ${
                      activeFilter === 'my_uploads'
                        ? 'bg-[#FFE5BF] text-[#BB0028] font-semibold shadow-xs'
                        : 'bg-transparent hover:bg-[#FFE5BF]/60 text-[#1A1817]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm text-[#68625D]">person</span>
                    <span>My uploads</span>
                    <span
                      className={`font-metadata-badge text-[11px] font-mono ${
                        activeFilter === 'my_uploads'
                          ? 'opacity-90'
                          : 'px-1.5 py-0.2 rounded-full bg-[#FFE5BF] text-[#746243]'
                      }`}
                    >
                      {myUploadsCount}
                    </span>
                  </button>

                  {/* Selected (Admin only) */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter('selected')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full font-label-md text-xs transition-all flex-shrink-0 cursor-pointer ${
                        activeFilter === 'selected'
                          ? 'bg-[#FFE5BF] text-[#BB0028] font-semibold shadow-xs'
                          : 'bg-transparent hover:bg-[#FFE5BF]/60 text-[#1A1817]'
                      }`}
                    >
                      <span>Selected</span>
                      <span className="font-metadata-badge text-[11px] px-1.5 py-0.2 rounded-full bg-[#FFE5BF] text-[#746243] font-mono">
                        {selectedCount}
                      </span>
                    </button>
                  )}

                  {/* Published Snapshot (Admin only, when published) */}
                  {isAdmin && isPublished && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter('published')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full font-label-md text-xs transition-all flex-shrink-0 cursor-pointer ${
                        activeFilter === 'published'
                          ? 'bg-[#FFE5BF] text-[#059669] font-semibold shadow-xs'
                          : 'bg-transparent hover:bg-[#FFE5BF]/60 text-[#1A1817]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                      <span>Published</span>
                      <span
                        className={`font-metadata-badge text-[11px] font-mono ${
                          activeFilter === 'published'
                            ? 'opacity-90 font-bold'
                            : 'px-1.5 py-0.2 rounded-full bg-[#DEF7EC] text-[#03543F]'
                        }`}
                      >
                        {publishedSnapshotCount}
                      </span>
                    </button>
                  )}

                  <div className="h-3.5 w-[1px] bg-[#EBE3D5] mx-0.5 flex-shrink-0" />

                  {/* View toggles */}
                  <div className="flex items-center gap-0.5 text-[#68625D] flex-shrink-0">
                    <button
                      type="button"
                      title="Grid Density"
                      onClick={() => setViewMode('grid')}
                      className={`p-1 rounded-full transition-colors cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-[#FFE5BF] text-[#1A1817]'
                          : 'hover:bg-[#FFE5BF] hover:text-[#1A1817]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base leading-none">grid_view</span>
                    </button>
                  </div>
                </div>

                {/* Crimson Upload Button */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-1 px-3 sm:px-3.5 py-1 rounded-full bg-[#BB0028] hover:bg-[#F62440] text-white font-label-md text-xs font-semibold transition-colors shadow-sm active:scale-95 flex-shrink-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base leading-none">cloud_upload</span>
                    <span>Upload</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 4. PHOTO GRID */}
            <section className="w-full">
              {filteredPhotos.length === 0 ? (
                <div className="py-16 px-6 rounded-2xl bg-[#FFF2DB]/50 border border-dashed border-[#FFE5BF] flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#FFE5BF] flex items-center justify-center text-[#784A1A] mb-3 shadow-xs">
                    <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#1A1817] mb-1">
                    {activeFilter === 'my_uploads'
                      ? 'No uploads by you yet'
                      : activeFilter === 'selected'
                      ? 'No photos selected yet'
                      : activeFilter === 'published'
                      ? 'No published photos in snapshot'
                      : 'No photos in this event yet'}
                  </h3>
                  <p className="font-body text-xs text-[#68625D] max-w-sm mb-4">
                    {activeFilter === 'selected'
                      ? 'Click on any photo in the grid to select it for the client gallery snapshot.'
                      : activeFilter === 'published'
                      ? 'Photos in the published snapshot will appear here. Publish or update snapshot to add photos.'
                      : 'Upload photos using the button above to begin curating.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#BB0028] hover:bg-[#F62440] text-white text-xs font-semibold px-4 py-2 rounded-full inline-flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">cloud_upload</span>
                    <span>Upload photos</span>
                  </button>
                </div>
              ) : isAdmin ? (
                /* ADMIN GRID: Click to toggle selection (or view if published) */
                <div className="grid grid-cols-2 min-[540px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 lg:gap-3.5">
                  {filteredPhotos.map((photo) => {
                    const isPublishedPhoto = isPhotoPublishedLocked(photo.id)
                    const isSelected = photo.selected_for_gallery && !isPublishedPhoto
                    return (
                      <article
                        key={photo.id}
                        onClick={
                          isPublishedPhoto
                            ? () => setPreviewPhoto(photo)
                            : () => handleToggleSelect(photo.id)
                        }
                        className={`group relative aspect-square rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 hover:scale-[1.015] bg-[#FFF2DB] p-0.5 cursor-pointer ${
                          isSelected ? 'ring-2 ring-[#BB0028]' : ''
                        }`}
                      >
                        <img
                          alt={photo.filename}
                          className="w-full h-full object-cover rounded-lg"
                          src={photo.thumbnail_url || photo.url}
                          loading="lazy"
                        />

                        {/* Selection Check Circle: ONLY rendered for unpublished photos */}
                        {!isPublishedPhoto && (
                          isSelected ? (
                            <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#BB0028] text-white flex items-center justify-center shadow-sm">
                              <span className="material-symbols-outlined text-xs font-bold leading-none">check</span>
                            </div>
                          ) : (
                            <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/25 backdrop-blur-sm group-hover:bg-white/90 text-transparent group-hover:text-[#1A1817] flex items-center justify-center transition-all cursor-pointer">
                              <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 leading-none">
                                check
                              </span>
                            </div>
                          )
                        )}

                        {/* Hover Overlay: Filename and Preview Action (matches Stitch hover design) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end justify-between p-2 pointer-events-none">
                          <span className="font-metadata-badge text-[10px] text-white drop-shadow truncate max-w-[78%] font-mono">
                            {photo.filename}
                          </span>
                          {!isPublishedPhoto && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenPreview(photo)
                              }}
                              className="pointer-events-auto w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm text-white/90 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
                              title="View photo"
                              aria-label={`View ${photo.filename}`}
                            >
                              <span className="material-symbols-outlined text-sm leading-none flex items-center justify-center select-none">
                                visibility
                              </span>
                            </button>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                /* TEAM MEMBER GRID: Click opens preview */
                <div className="grid grid-cols-2 min-[540px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 lg:gap-3.5">
                  {filteredPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => handleOpenPreview(photo)}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-[#FFF2DB] shadow-xs cursor-pointer transition duration-200 hover:scale-[1.015] hover:shadow-md"
                    >
                      <img
                        alt={photo.filename}
                        className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
                        src={photo.thumbnail_url || photo.url}
                        loading="lazy"
                      />

                      {/* Discreet 'You' Pill for user uploads */}
                      {photo.uploaded_by === user?.id && (
                        <div className="absolute top-2 left-2 z-10 pointer-events-none">
                          <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-metadata-badge px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-400" />
                            You
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 5. PINNED BOTTOM PANELS */}
            {/* Floating Selection Bar (Admin only) */}
            {isAdmin && activeSelectedCount > 0 && (
              <div
                className={`fixed left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto z-40 transition-all duration-300 max-w-md sm:max-w-none mx-auto ${
                  isUploadTrayVisible && !isUploadTrayMinimized
                    ? 'bottom-28 sm:bottom-6'
                    : 'bottom-4 sm:bottom-6'
                } animate-fade-in`}
              >
                <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3.5 bg-[#FFF2DB] px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-[0_10px_30px_rgba(60,30,10,0.18)] border border-[#F6D2B2] overflow-x-auto no-scrollbar max-w-full">
                  <span className="font-headline-sm text-xs font-bold text-[#1A1817] whitespace-nowrap flex-shrink-0">
                    {activeSelectedCount} selected
                  </span>
                  <div className="flex items-center gap-2">
                    {activeSelectedCount === 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSetCoverPhoto(activeSelectedIds[0])}
                          disabled={isSettingCover || isCurrentSelectionCover}
                          className={`font-label-sm text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap ${
                            isCurrentSelectionCover
                              ? 'text-[#784A1A]/70 cursor-default'
                              : 'text-[#784A1A] hover:text-[#1A1817] cursor-pointer'
                          } disabled:opacity-50`}
                          title={isCurrentSelectionCover ? 'This photo is currently the event cover' : 'Set this photo as event cover'}
                        >
                          {isSettingCover ? (
                            <span className="material-symbols-outlined text-sm leading-none animate-spin">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-sm leading-none text-[#F59E0B]">
                              {isCurrentSelectionCover ? 'star' : 'star_outline'}
                            </span>
                          )}
                          <span>{isCurrentSelectionCover ? 'Cover photo' : 'Set as cover'}</span>
                        </button>
                        <span className="w-px h-3 bg-[#EBE3D5]" />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      disabled={selectableFilteredPhotos.length === 0 || selectableFilteredPhotos.every((p) => p.selected_for_gallery)}
                      className="font-label-sm text-xs text-[#68625D] hover:text-primary transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      disabled={activeSelectedCount === 0}
                      className="font-label-sm text-xs text-[#68625D] hover:text-primary transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Clear
                    </button>
                    <span className="w-px h-3 bg-[#EBE3D5]" />
                    <button
                      type="button"
                      disabled={deletableSelectedCount === 0}
                      onClick={handleOpenDeletePhotosModal}
                      title={
                        deletableSelectedCount === 0 && selectedCount > 0
                          ? 'Published photos cannot be deleted while gallery is live'
                          : undefined
                      }
                      className="font-label-sm text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm leading-none">delete</span>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Upload Progress Tray */}
      {isUploadTrayVisible && (
        <aside
          id="uploadTray"
          aria-label="Upload progress tray"
          className="fixed bottom-0 sm:bottom-4 left-0 sm:left-auto right-0 sm:right-6 w-full sm:w-80 md:w-96 z-50 rounded-t-2xl sm:rounded-2xl shadow-[0_-8px_32px_rgba(60,30,10,0.18)] sm:shadow-[0_12px_32px_rgba(60,30,10,0.16)] transition-all duration-300 bg-[#FFF2DB] border-t sm:border border-[#F6D2B2] overflow-hidden"
        >
          {/* Mobile pull indicator bar */}
          <div className="w-8 h-1 bg-[#E8D4BE] rounded-full mx-auto mt-2 sm:hidden" />

          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#FFF2DB]">
            <div
              className="flex items-center gap-2 min-w-0 cursor-pointer select-none flex-1"
              onClick={() => setIsUploadTrayMinimized(!isUploadTrayMinimized)}
              title="Click to expand/minimize"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  uploadState === 'error'
                    ? 'bg-[#FFDAD8] text-[#BA1A1A]'
                    : uploadState === 'partial'
                    ? 'bg-[#FFE5BF] text-[#D97706]'
                    : uploadState === 'success'
                    ? 'bg-[#E2F7E4] text-[#1B5E20]'
                    : 'bg-[#FFE5BF] text-[#BB0028]'
                }`}
              >
                <span className="material-symbols-outlined text-sm leading-none">
                  {uploadState === 'error'
                    ? 'error'
                    : uploadState === 'partial'
                    ? 'warning'
                    : uploadState === 'success'
                    ? 'check_circle'
                    : 'cloud_sync'}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-label-md text-xs text-[#1A1817] font-semibold truncate">
                    {uploadState === 'uploading'
                      ? 'Uploading photos'
                      : uploadState === 'error'
                      ? 'Upload failed'
                      : uploadState === 'partial'
                      ? 'Upload completed with issues'
                      : 'Upload complete'}
                  </span>
                  {uploadState === 'uploading' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BB0028] animate-pulse flex-shrink-0" />
                  )}
                </div>
                <span className="font-metadata-badge text-[10px] text-[#68625D] truncate font-mono">
                  {uploadProgress?.message || uploadProgress?.filename || 'Processing...'}
                </span>
              </div>
            </div>

            {/* Action controls (Minimize & Close) */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsUploadTrayMinimized(!isUploadTrayMinimized)}
                aria-label={isUploadTrayMinimized ? 'Expand upload tray' : 'Minimize upload tray'}
                title={isUploadTrayMinimized ? 'Expand' : 'Minimize'}
                className="text-[#68625D] hover:text-[#1A1817] p-1 rounded-full hover:bg-[#FFE5BF]/70 transition-colors flex-shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base leading-none">
                  {isUploadTrayMinimized ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsUploadTrayVisible(false)}
                aria-label="Close upload tray"
                title="Close"
                className="text-[#68625D] hover:text-[#1A1817] p-1 rounded-full hover:bg-[#FFE5BF]/70 transition-colors flex-shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base leading-none">close</span>
              </button>
            </div>
          </div>

          {/* Body content (Hidden when minimized) */}
          {!isUploadTrayMinimized && (
            <div className="px-3 pb-2.5 pt-0 border-t border-[#F6D2B2]/40 bg-[#FFF2DB]">
              <div className="w-full bg-[#FFFAF3] rounded-full h-1.5 overflow-hidden shadow-inner my-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    uploadState === 'error'
                      ? 'bg-[#BA1A1A]'
                      : uploadState === 'partial'
                      ? 'bg-[#D97706]'
                      : uploadState === 'success'
                      ? 'bg-[#1B5E20]'
                      : 'bg-[#BB0028]'
                  }`}
                  style={{ width: `${uploadProgress?.percent ?? 100}%` }}
                />
              </div>
              {uploadProgress?.failedFiles && uploadProgress.failedFiles.length > 0 && (
                <div className="mt-1.5 text-left">
                  <p className="text-[10px] font-semibold text-[#BA1A1A] mb-0.5">
                    Failed items ({uploadProgress.failedFiles.length}):
                  </p>
                  <ul className="max-h-20 overflow-y-auto space-y-0.5 pr-1">
                    {uploadProgress.failedFiles.map((errItem, idx) => (
                      <li key={idx} className="text-[9.5px] text-[#706862] font-mono truncate" title={errItem}>
                        • {errItem}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </aside>
      )}

      {/* Photo Lightbox / Preview Modal */}
      {previewPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 ${
            isPreviewClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
          }`}
          onClick={handleClosePreview}
        >
          <div
            className={`relative max-w-3xl w-full bg-[#FFF2DB] rounded-2xl p-3 sm:p-4 shadow-[0_16px_40px_-8px_rgba(60,30,10,0.2)] flex flex-col gap-3 ${
              isPreviewClosing ? 'animate-modal-pop-out' : 'animate-modal-pop-in'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#BB0028]" />
                <span className="font-headline-sm text-sm sm:text-base font-bold text-[#1A1817]">
                  {previewPhoto.filename}
                </span>
                <span className="font-metadata-badge text-[11px] text-[#68625D] font-mono">
                  {previewPhoto.file_size ? `${Math.round(previewPhoto.file_size / 1024)} KB` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleSetCoverPhoto(previewPhoto.id)}
                    disabled={
                      isSettingCover ||
                      Boolean(
                        eventData?.cover_image_url &&
                        (previewPhoto.thumbnail_url === eventData.cover_image_url || previewPhoto.url === eventData.cover_image_url)
                      )
                    }
                    className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FFE5BF] hover:bg-[#F6D2B2] text-[#784A1A] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-sm text-[#F59E0B]">
                      {eventData?.cover_image_url &&
                      (previewPhoto.thumbnail_url === eventData.cover_image_url || previewPhoto.url === eventData.cover_image_url)
                        ? 'star'
                        : 'star_outline'}
                    </span>
                    <span>
                      {eventData?.cover_image_url &&
                      (previewPhoto.thumbnail_url === eventData.cover_image_url || previewPhoto.url === eventData.cover_image_url)
                        ? 'Cover photo'
                        : 'Set as cover'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="p-1 rounded-full hover:bg-[#FFE5BF] text-[#1A1817] transition-colors cursor-pointer"
                  aria-label="Close preview"
                >
                  <span className="material-symbols-outlined text-lg leading-none">close</span>
                </button>
              </div>
            </div>
            <div className="relative w-full h-[55vh] rounded-xl overflow-hidden bg-black/5 flex items-center justify-center">
              <img
                alt={previewPhoto.filename}
                className="w-full h-full object-contain select-none"
                src={previewPhoto.url}
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. FOOTER */}
      <footer className="w-full bg-[#FFFAF3] py-2.5 sm:py-3 border-t border-[#F6D2B2]/40 shadow-[0_-1px_6px_rgba(80,50,20,0.02)]">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="font-body-sm text-[11px] text-[#68625D]">
            © 2026 Momently. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5 font-metadata-badge text-[10px] text-[#68625D] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            <span>All systems operational</span>
            <span className="text-[#68625D]/40">·</span>
            <span>Encrypted Studio Storage</span>
          </div>
        </div>
      </footer>

      {/* Modals (Admin Only) */}
      <TeamModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        eventName={eventName}
        adminUser={
          eventData?.admin
            ? {
                ...eventData.admin,
                photosCount: photos.filter((p) => p.uploaded_by === eventData.admin.id).length,
              }
            : null
        }
        teamMembers={(eventData?.team_members || []).map((m) => ({
          ...m,
          photosCount: photos.filter((p) => p.uploaded_by === m.id).length,
        }))}
        onAddMember={handleAddTeamMember}
        onRemoveMember={handleRemoveTeamMember}
      />

      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        selectedCount={selectedCount}
        eventName={eventName}
        onPublish={handlePublishGallery}
      />

      <GallerySettingsModal
        isOpen={gallerySettingsOpen}
        onClose={() => {
          if (!isUpdatingSnapshot) setGallerySettingsOpen(false)
        }}
        gallerySlug={gallery?.slug || eventName.toLowerCase().replace(/\s+/g, '-')}
        publishedDate={
          gallery?.created_at
            ? new Date(gallery.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
            : 'Recently'
        }
        snapshotCount={publishedSnapshotCount}
        unpublishedCount={unpublishedChangesCount}
        isUpdatingSnapshot={isUpdatingSnapshot}
        onUpdateSnapshot={handleUpdateSnapshot}
        onChangePinClick={() => {
          setGallerySettingsOpen(false)
          setChangePinOpen(true)
        }}
        onUnpublish={handleOpenUnpublishModal}
      />

      <ChangePinModal
        isOpen={changePinOpen}
        onClose={() => setChangePinOpen(false)}
        onChangePin={handleChangePin}
      />

      <GalleryPublishedModal
        isOpen={galleryPublishedOpen}
        onClose={() => setGalleryPublishedOpen(false)}
        gallerySlug={gallery?.slug || eventName.toLowerCase().replace(/\s+/g, '-')}
        pin={lastUsedPin}
        eventName={eventName}
      />

      <DeleteEventModal
        isOpen={deleteEventModalOpen}
        onClose={() => setDeleteEventModalOpen(false)}
        onConfirm={handleConfirmDeleteEvent}
        eventName={eventName}
      />

      <DeletePhotosModal
        isOpen={deletePhotosModalOpen}
        onClose={() => {
          if (!isDeletingPhotos) setDeletePhotosModalOpen(false)
        }}
        onConfirm={handleConfirmDeletePhotos}
        photoCount={deletableSelectedCount}
        isDeleting={isDeletingPhotos}
      />

      <PublishRequirementModal
        isOpen={publishRequirementModalOpen}
        onClose={() => setPublishRequirementModalOpen(false)}
        totalPhotos={photos.length}
        onUploadClick={() => fileInputRef.current?.click()}
      />

      <UnpublishGalleryModal
        isOpen={unpublishModalOpen}
        onClose={() => setUnpublishModalOpen(false)}
        onConfirm={handleConfirmUnpublish}
        isUnpublishing={isUnpublishing}
      />

      <SnapshotUpdatedModal
        isOpen={snapshotUpdatedModalOpen}
        onClose={() => setSnapshotUpdatedModalOpen(false)}
        snapshotCount={publishedSnapshotCount}
      />

      <ActionErrorModal
        isOpen={errorModalState.isOpen}
        onClose={() => setErrorModalState({ isOpen: false, title: '', message: '' })}
        title={errorModalState.title}
        message={errorModalState.message}
      />
    </div>
  )
}
