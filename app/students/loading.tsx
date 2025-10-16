export default function Loading() {
  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="h-7 w-56 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}


