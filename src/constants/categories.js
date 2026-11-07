export const TYPE_TAGS = [
  { value: "animal_welfare",        label: "Animal Welfare",        color: "yellow", icon: "🐾" },
  { value: "environmental",         label: "Environmental",         color: "green",  icon: "🌱" },
  { value: "healthcare_wellness",   label: "Healthcare & Wellness", color: "red",    icon: "❤️" },
  { value: "community_development", label: "Community Development", color: "purple", icon: "🤝" },
  { value: "education",             label: "Education",             color: "blue",   icon: "📚" },
  { value: "arts_culture",          label: "Arts & Culture",        color: "pink",   icon: "🎨" },
  { value: "other",                 label: "Others",                color: "gray",   icon: "📌" },
]

export const COMMITMENT_TAGS = [
  { value: "virtual_remote",       label: "Virtual / Remote",       color: "cyan",   icon: "💻" },
  { value: "long_term_recurring",  label: "Long-term / Recurring",  color: "indigo", icon: "🔁" },
  { value: "short_term_event",     label: "Short-term / Event",     color: "orange", icon: "📅" },
  { value: "spontaneous_disaster", label: "Spontaneous / Disaster", color: "rose",   icon: "🚨" },
]

export const TYPE_TAG_STYLES = {
  yellow: { card: "bg-yellow-50 border-yellow-400", badge: "bg-yellow-100 text-yellow-800" },
  green:  { card: "bg-green-50 border-green-400",   badge: "bg-green-100 text-green-800"   },
  red:    { card: "bg-red-50 border-red-400",       badge: "bg-red-100 text-red-800"       },
  purple: { card: "bg-purple-50 border-purple-400", badge: "bg-purple-100 text-purple-800" },
  blue:   { card: "bg-blue-50 border-blue-400",     badge: "bg-blue-100 text-blue-800"     },
  pink:   { card: "bg-pink-50 border-pink-400",     badge: "bg-pink-100 text-pink-800"     },
  gray:   { card: "bg-gray-50 border-gray-400",     badge: "bg-gray-100 text-gray-800"     },
}

export const COMMITMENT_TAG_STYLES = {
  cyan:   "bg-cyan-100 text-cyan-800",
  indigo: "bg-indigo-100 text-indigo-800",
  orange: "bg-orange-100 text-orange-800",
  rose:   "bg-rose-100 text-rose-800",
}