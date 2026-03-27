'use client'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Something went wrong</h2>
          <button
            onClick={() => unstable_retry()}
            style={{ padding: '0.5rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
