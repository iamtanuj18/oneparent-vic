
interface ActivitySkeletonProps {
  isForMyself?: boolean;
  isOutdoor?: boolean;
}

export function ActivitySkeleton({ isForMyself = true, isOutdoor = false }: ActivitySkeletonProps) {
  return (
    <div className="space-y-8 animate-pulse">
      {/* title banner skeleton */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-400 p-8">
        <div className="space-y-4">
          <div className="h-7 bg-white bg-opacity-30 rounded-lg w-3/4"></div>
          <div className="flex space-x-3">
            <div className="h-8 bg-white bg-opacity-20 rounded-full w-20"></div>
            <div className="h-8 bg-white bg-opacity-20 rounded-full w-24"></div>
            <div className="h-8 bg-white bg-opacity-20 rounded-full w-28"></div>
          </div>
          <div className="h-5 bg-white bg-opacity-20 rounded w-full"></div>
          <div className="h-5 bg-white bg-opacity-20 rounded w-2/3"></div>
        </div>
      </div>

      {/* content boxes skeleton */}
      <div className="space-y-6">
        {/* weather insight placeholder - only for outdoor activities */}
        {isOutdoor && (
          <div className="bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-sky-200 rounded-full"></div>
              <div className="h-6 bg-sky-200 rounded w-1/3"></div>
            </div>
            <div className="h-4 bg-sky-100 rounded w-full"></div>
            <div className="h-4 bg-sky-100 rounded w-3/4 mt-2"></div>
          </div>
        )}

        {/* outcomes placeholder */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-6">
          <div className="h-6 bg-blue-200 rounded w-1/3 mb-4"></div>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-white shadow-sm rounded-full w-20 border border-gray-200"></div>
            ))}
          </div>
        </div>

        {/* materials placeholder */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-2xl p-6">
          <div className="h-6 bg-emerald-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center space-x-3 py-3 px-4 bg-white rounded-xl shadow-sm">
                <div className="w-6 h-6 bg-emerald-200 rounded-full"></div>
                <div className="h-4 bg-gray-100 rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>

        {/* steps placeholder */}
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200 rounded-2xl p-6">
          <div className="h-6 bg-slate-200 rounded w-1/6 mb-6"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-4 p-4 bg-white rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-blue-300 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* tips section placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* safety tips placeholder */}
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-red-200 rounded-full"></div>
              <div className="h-5 bg-red-200 rounded w-32"></div> {/* "Safety Notes" width */}
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-red-100 rounded w-full"></div>
              ))}
            </div>
          </div>
          
          {/* bonding tips placeholder */}
          <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
              <div className="h-5 bg-blue-200 rounded w-36"></div> {/* "Tips for You" or "Parent Power-Ups" width */}
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-blue-100 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>

        {/* budget notes placeholder */}
        <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-green-200 rounded-full"></div>
            <div className="h-5 bg-green-200 rounded w-1/4"></div>
          </div>
          <div className="h-4 bg-green-100 rounded w-full"></div>
          <div className="h-4 bg-green-100 rounded w-2/3 mt-2"></div>
        </div>

        {/* action buttons placeholder */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <div className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}