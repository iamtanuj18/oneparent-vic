export function SafetyCheckLoader() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Safety Check in Progress
        </h3>
        <p className="text-gray-600">
          Checking your inputs for safety...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This may take a few moments
        </p>
      </div>
    </div>
  );
}