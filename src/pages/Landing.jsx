import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignUpForm'

export default function Landing() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [modal, setModal]   = useState(null) // null | 'login' | 'signup'
  const [tab, setTab]       = useState('signup')

  // If already logged in, go straight to dashboard
  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user])

  function openModal(defaultTab) {
    setTab(defaultTab)
    setModal('open')
  }

  function closeModal() {
    setModal(null)
  }

  function handleAuthSuccess() {
    closeModal()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <span className="text-xl font-bold text-green-600">VolunteerNow</span>
        <div className="flex gap-3">
          <button
            onClick={() => openModal('login')}
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => openModal('signup')}
            className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Sign Up Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Find volunteer events <br />
          <span className="text-green-600">near you</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Discover local volunteer opportunities, join causes you care about,
          or create your own event and gather people to make a difference.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => openModal('signup')}
            className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-700 transition-colors"
          >
            Get Started
          </button>
          <button
            onClick={() => openModal('login')}
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Sign In
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "📍", title: "Events Near You",    desc: "See volunteer events happening in your city, filtered by what matters to you." },
            { icon: "🗓️", title: "Create Events",      desc: "Organize your own volunteer event and invite your community to join." },
            { icon: "✅", title: "Track Your Impact",  desc: "Keep a record of every event you've joined and created." },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Auth Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tabs */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTab('signup')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  tab === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  tab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Sign In
              </button>
            </div>

            {tab === 'signup'
              ? <SignupForm onSuccess={handleAuthSuccess} />
              : <LoginForm  onSuccess={handleAuthSuccess} />
            }

            <button
              onClick={closeModal}
              className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
