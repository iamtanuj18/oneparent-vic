interface SafetyErrorProps {
  message?: string;
  issues?: any[];
  flaggedItems?: string[];
  planFor?: 'myself' | 'withKids';
}

export function SafetyError({ message, issues = [], flaggedItems = [], planFor = 'myself' }: SafetyErrorProps) {
  const displayItems = flaggedItems.length > 0 ? flaggedItems : issues.map(i => i?.value).filter(Boolean);
  
  // Generic messages based on plan type
  const genericMessage = planFor === 'withKids' 
    ? "Unsafe, inappropriate, or meaningless inputs found for kid-friendly activity generation. Please review and remove the following:"
    : "Unsafe, inappropriate, or meaningless inputs found for activity generation. Please review and remove the following:";
  
  const displayMessage = message || genericMessage;

  // Simple slightly bold text display for flagged items
  const renderFlaggedItems = (items: string[]) => {
    return (
      <div className="mt-3">
        <span className="text-red-800 font-medium">
          {items.join(', ')}
        </span>
      </div>
    );
  };
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-red-600 text-xl">⚠️</span>
        </div>
        <div className="flex-1">
          <p className="text-red-800 font-medium mb-3">
            {displayMessage}
          </p>
          {displayItems.length > 0 && renderFlaggedItems(displayItems)}
        </div>
      </div>
    </div>
  );
}