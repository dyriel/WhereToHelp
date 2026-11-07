export default function EventCardSkeleton() {
  return (
    <div className="rounded-xl border-l-4 border-gray-200 bg-gray-50 p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-5 w-24 bg-gray-200 rounded-full" />
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-1/2 bg-gray-200 rounded mb-3" />
      <div className="flex justify-between">
        <div className="h-4 w-1/3 bg-gray-200 rounded" />
        <div className="h-4 w-1/4 bg-gray-200 rounded" />
      </div>
    </div>
  )
}