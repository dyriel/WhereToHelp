import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  // Get first letter of name for the avatar circle
  const initial = profile?.name?.charAt(0).toUpperCase() || '?'

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
      <Link to="/dashboard" className="logo text-xl font-bold text-green-600">
        Where2Help
      </Link>

      <div className="flex items-center gap-4">
        <Link
          to="/events/create"
          className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          + Create Event
        </Link>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 rounded-full bg-green-100 text-green-700 font-semibold flex items-center justify-center hover:bg-green-200 transition-colors"
          >
            {initial}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-10">
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}