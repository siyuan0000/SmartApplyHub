export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-4">
          Sorry, we couldn't complete your authentication. Please try logging in again.
        </p>
        <a 
          href="/login" 
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}