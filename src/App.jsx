import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Browse from './pages/Browse'
import CreateEvent from './pages/CreateEvent'
import EventDetail from './pages/EventDetail'
import EditEvent from './pages/EditEvent'
import Profile from './pages/Profile'

const queryClient = new QueryClient()

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/browse"          element={<ProtectedRoute><Browse /></ProtectedRoute>} />
            <Route path="/events/create"   element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
            <Route path="/events/:id"      element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
            <Route path="/events/:id/edit" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
            <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}