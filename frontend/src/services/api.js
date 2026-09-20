/**
 * Momently API Client & Service Layer
 * Connects to the FastAPI backend at http://localhost:8000
 */

const API_BASE_URL = import.meta.env.VITE_API_URL

/**
 * Standard HTTP request wrapper with automatic Bearer token injection
 * and normalized error extraction.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = new Headers(options.headers || {})

  // Attach JWT Bearer token if user is authenticated and no custom Authorization is present
  const token = localStorage.getItem('momently_token')
  if (token && !headers.has('Authorization') && !options.skipAuth) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Set JSON content-type if body is an object and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // 204 No Content
  if (response.status === 204) {
    return null
  }

  let data = null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    data = await response.json().catch(() => null)
  } else {
    data = await response.text().catch(() => null)
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred. Please try again.'
    if (data && data.detail) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((err) => err.msg || JSON.stringify(err)).join(', ')
      } else {
        errorMessage = JSON.stringify(data.detail)
      }
    } else if (typeof data === 'string' && data.length > 0) {
      errorMessage = data
    }

    const error = new Error(errorMessage)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

/* =========================================================================
   1. AUTHENTICATION SERVICES
   ========================================================================= */
export const authService = {
  /**
   * Register a new user
   * role: "admin" | "team_member"
   */
  async register({ name, email, password, role = 'team_member' }) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    })
  },

  /**
   * Login an existing user and retrieve access token
   */
  async login({ email, password }) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (data?.access_token) {
      localStorage.setItem('momently_token', data.access_token)
    }
    return data
  },

  /**
   * Get current authenticated user profile
   */
  async getMe() {
    return request('/auth/me')
  },

  /**
   * Logout user by clearing credentials
   */
  logout() {
    localStorage.removeItem('momently_token')
    localStorage.removeItem('momently_user')
  },
}

/* =========================================================================
   2. EVENTS SERVICES
   ========================================================================= */
export const eventsService = {
  /**
   * List events for current user (admin sees created, member sees assigned)
   */
  async getEvents() {
    return request('/events')
  },

  /**
   * Get details of a specific event
   */
  async getEvent(eventId) {
    return request(`/events/${eventId}`)
  },

  /**
   * Create a new event (admin only)
   */
  async createEvent({ name, description }) {
    return request('/events', {
      method: 'POST',
      body: JSON.stringify({ name, description: description || null }),
    })
  },

  /**
   * Delete an event and its photos/galleries (admin only)
   */
  async deleteEvent(eventId) {
    return request(`/events/${eventId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Add a team member to an event by email (admin only)
   */
  async addTeamMember(eventId, email) {
    return request(`/events/${eventId}/team-members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  /**
   * Remove a team member from an event (admin only)
   */
  async removeTeamMember(eventId, userId) {
    return request(`/events/${eventId}/members/${userId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Set event cover photo (admin only)
   */
  async setCoverPhoto(eventId, photoId) {
    return request(`/events/${eventId}/cover`, {
      method: 'PATCH',
      body: JSON.stringify({ photo_id: photoId }),
    })
  },
}

/* =========================================================================
   3. PHOTOS SERVICES
   ========================================================================= */
export const photosService = {
  /**
   * List all photos for an event
   */
  async getPhotos(eventId) {
    return request(`/photos/${eventId}`)
  },

  /**
   * Upload multiple image files to an event (multipart/form-data)
   */
  async uploadPhotos(eventId, files) {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    return request(`/photos/${eventId}`, {
      method: 'POST',
      body: formData,
    })
  },

  /**
   * Bulk select or deselect photos for gallery curation (admin only)
   */
  async selectPhotos(eventId, photoIds, selected = true) {
    return request(`/photos/${eventId}/select`, {
      method: 'PATCH',
      body: JSON.stringify({ photo_ids: photoIds, selected }),
    })
  },

  /**
   * Update selection via select and deselect lists
   */
  async updateSelection(eventId, { select = [], deselect = [] }) {
    return request(`/photos/event/${eventId}/selection`, {
      method: 'PATCH',
      body: JSON.stringify({ select, deselect }),
    })
  },

  /**
   * Delete an individual photo
   */
  async deletePhoto(photoId) {
    return request(`/photos/${photoId}`, {
      method: 'DELETE',
    })
  },
}

/* =========================================================================
   4. GALLERIES SERVICES (Admin & Public)
   ========================================================================= */
export const galleriesService = {
  /**
   * Publish gallery snapshot with a 4-digit PIN (admin only)
   */
  async publishGallery(eventId, pin) {
    return request(`/galleries/events/${eventId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ pin: pin || null }),
    })
  },

  /**
   * Get gallery snapshot status for an event (admin only)
   */
  async getGallery(eventId) {
    return request(`/galleries/events/${eventId}`)
  },

  /**
   * Get photos belonging to the published gallery snapshot in stored order (admin only)
   */
  async getPublishedPhotos(eventId) {
    return request(`/galleries/events/${eventId}/photos`)
  },

  /**
   * Add currently selected event photos to an existing published snapshot (admin only)
   * Additive snapshot: preserves previously published photos and adds newly selected ones.
   */
  async updateSnapshot(eventId) {
    return request(`/galleries/events/${eventId}/snapshot`, {
      method: 'PATCH',
    })
  },


  /**
   * Change gallery PIN without modifying snapshot (admin only)
   */
  async updatePin(eventId, pin) {
    return request(`/galleries/events/${eventId}/pin`, {
      method: 'PATCH',
      body: JSON.stringify({ pin }),
    })
  },

  /**
   * Unpublish gallery without destroying slug or snapshot (admin only)
   */
  async unpublishGallery(eventId) {
    return request(`/galleries/events/${eventId}/unpublish`, {
      method: 'PATCH',
    })
  },

  /**
   * Public: Get public gallery info before entering PIN (no auth)
   */
  async getPublicGalleryInfo(slug) {
    return request(`/galleries/public/${slug}`, {
      skipAuth: true,
    })
  },

  /**
   * Public: Exchange correct 4-digit PIN for client gallery access and photos
   */
  async accessPublicGallery(slug, pin) {
    return request(`/galleries/public/${slug}/access`, {
      method: 'POST',
      body: JSON.stringify({ pin }),
      skipAuth: true,
    })
  },

  /**
   * Public: Download all published photos as zip archive (requires gallery access token)
   */
  async downloadAllArchive(slug, galleryToken) {
    return request(`/galleries/public/${slug}/download-all`, {
      headers: {
        Authorization: `Bearer ${galleryToken}`,
      },
    })
  },
}
