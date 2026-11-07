export default function TagFilter({ tags, tagStyles, selected, onChange }) {
  function toggleTag(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isSelected = selected.includes(tag.value)
        const style = tagStyles[tag.color]

        // style is either a string (commitment tags) or an object with .badge (type tags)
        const selectedClass = typeof style === 'string' ? style : style?.badge

        return (
          <button
            key={tag.value}
            onClick={() => toggleTag(tag.value)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              isSelected
                ? `${selectedClass} border-transparent font-medium`
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {tag.icon} {tag.label}
          </button>
        )
      })}
    </div>
  )
}