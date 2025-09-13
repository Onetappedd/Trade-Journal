import { Skeleton } from "@/components/ui/skeleton"

export default function JournalLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header Skeleton */}
      <div className="border-b border-slate-800/50 bg-slate-950/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 bg-slate-800" />
              <Skeleton className="h-4 w-64 bg-slate-800" />
            </div>
            <Skeleton className="h-10 w-32 bg-slate-800" />
          </div>
        </div>
      </div>

      {/* Timeline Content Skeleton */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Date Header Skeleton */}
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5 bg-slate-800" />
            <Skeleton className="h-6 w-32 bg-slate-800" />
            <Skeleton className="h-6 w-16 bg-slate-800" />
          </div>

          {/* Timeline Entries Skeleton */}
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="relative flex items-start space-x-6">
              <div className="relative z-10 flex-shrink-0">
                <Skeleton className="h-4 w-4 rounded-full bg-slate-800" />
              </div>
              <div className="flex-1 bg-slate-900/50 border border-slate-800/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-16 bg-slate-800" />
                      <Skeleton className="h-4 w-20 bg-slate-800" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 bg-slate-800" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-slate-800" />
                  <Skeleton className="h-4 w-3/4 bg-slate-800" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16 bg-slate-800" />
                    <Skeleton className="h-6 w-20 bg-slate-800" />
                    <Skeleton className="h-6 w-14 bg-slate-800" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
