import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import EventWorkspacePage from './pages/EventWorkspacePage'
import GalleryPinPage from './pages/GalleryPinPage'
import GalleryLockedPage from './pages/GalleryLockedPage'
import GalleryViewPage from './pages/GalleryViewPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/events/:eventId" element={<EventWorkspacePage />} />
      {/* Dedicated Demo Gallery Routes (always available without backend) */}
      <Route path="/demo" element={<GalleryPinPage isDemo />} />
      <Route path="/demo/view" element={<GalleryViewPage isDemo />} />
      <Route path="/gallery/demo" element={<GalleryPinPage isDemo />} />
      <Route path="/gallery/demo/view" element={<GalleryViewPage isDemo />} />

      {/* Real Public Gallery Routes */}
      <Route path="/gallery/:slug" element={<GalleryPinPage />} />
      <Route path="/gallery/:slug/locked" element={<GalleryLockedPage />} />
      <Route path="/gallery/:slug/view" element={<GalleryViewPage />} />
    </Routes>
  )
}
