export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          ✅ Server is Working!
        </h1>
        <p className="text-gray-600">
          If you can see this page, the Next.js development server is running correctly.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <h2 className="font-semibold text-blue-800">Next Steps:</h2>
          <ul className="mt-2 text-blue-700 text-sm">
            <li>• Try accessing /auth/signin</li>
            <li>• Check browser console for errors</li>
            <li>• Verify database connection</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
