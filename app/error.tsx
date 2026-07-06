'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Terjadi Kesalahan</h2>
        <p className="text-gray-500 mb-6">{error.message || 'Sesuatu yang tidak terduga terjadi.'}</p>
        <button
          onClick={reset}
          className="btn-primary px-6 py-2"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
