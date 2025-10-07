// ✅ TEST CASE: Empty Week Placeholders
// Run this in browser console to test empty week functionality

console.log("🧪 TESTING EMPTY WEEK PLACEHOLDERS");
console.log("==================================");

// Clear existing data
localStorage.clear();
console.log("✅ Cleared localStorage");

// Set user start date to 3 weeks ago (Week 1 starts Sep 15)
localStorage.setItem("user-emotion-start-date", "2025-09-15");

// Create test data with gaps: Week 1 has data, Week 2 is empty, Week 3 has data
const testLogs = [
  // Week 1: Sep 15-21, 2025 (HAS DATA)
  {id: "sep15", date: "Mon Sep 15 2025", timestamp: new Date("2025-09-15T12:00:00Z").getTime(), mood: 4, energy: 70, overwhelm: 30, emotions: ["excited", "motivated"], week: 1},
  {id: "sep17", date: "Wed Sep 17 2025", timestamp: new Date("2025-09-17T12:00:00Z").getTime(), mood: 5, energy: 80, overwhelm: 20, emotions: ["joyful", "grateful"], week: 1},
  {id: "sep19", date: "Fri Sep 19 2025", timestamp: new Date("2025-09-19T12:00:00Z").getTime(), mood: 3, energy: 50, overwhelm: 50, emotions: ["tired", "stressed"], week: 1},
  
  // Week 2: Sep 22-28, 2025 (EMPTY - NO DATA)
  
  // Week 3: Sep 29 - Oct 5, 2025 (HAS DATA) 
  {id: "sep30", date: "Tue Sep 30 2025", timestamp: new Date("2025-09-30T12:00:00Z").getTime(), mood: 4, energy: 75, overwhelm: 25, emotions: ["accomplished", "proud"], week: 3},
  {id: "oct2", date: "Thu Oct 02 2025", timestamp: new Date("2025-10-02T12:00:00Z").getTime(), mood: 5, energy: 85, overwhelm: 15, emotions: ["joyful", "energized"], week: 3},
];

localStorage.setItem("emotion-logs", JSON.stringify(testLogs));
console.log("✅ Test data loaded with gaps");

// Add AI insights for weeks that have data (Week 1 and 3)
localStorage.setItem("emotion-insights-generated", JSON.stringify([1, 3]));

localStorage.setItem("emotion-insights-week-1", JSON.stringify({
  "analysis": {
    "weeklyOverview": "This week showed great emotional variety with exciting moments and some challenges. You handled the ups and downs well!",
    "emotionalPatterns": ["Mixed energy levels throughout the week", "Good emotional range from tired to joyful"],
    "keyInsights": ["You experienced both excitement and stress, showing emotional authenticity", "Friday's tiredness is normal after a busy week"],
    "progressComparison": "No previous week data available.",
    "personalizedTips": ["Take breaks when feeling overwhelmed", "Celebrate exciting moments", "Plan recovery time after busy periods"],
    "concernAreas": [],
    "positiveHighlights": ["Excitement and motivation on Monday", "Joy and gratitude on Wednesday"],
    "nextWeekFocus": "Balance high energy activities with rest periods."
  },
  "generatedAt": "2025-10-07T04:16:32.370Z"
}));

localStorage.setItem("emotion-insights-week-3", JSON.stringify({
  "analysis": {
    "weeklyOverview": "Excellent week with high achievement feelings and sustained positive energy. You're showing great progress!",
    "emotionalPatterns": ["Consistently high energy and positive mood", "Low overwhelm levels maintained"],
    "keyInsights": ["Strong sense of accomplishment throughout the week", "Energy levels remained high and stable", "You're managing challenges effectively"],
    "progressComparison": "Significant improvement from Week 1 - energy up from 66% to 80%, overwhelm down from 33% to 20%!",
    "personalizedTips": ["Keep celebrating your accomplishments", "Maintain current energy management strategies", "Use this positive momentum for future challenges"],
    "concernAreas": [],
    "positiveHighlights": ["Feeling accomplished and proud on Tuesday", "Joyful and energized on Thursday"],
    "nextWeekFocus": "Build on this momentum while staying grounded."
  },
  "generatedAt": "2025-10-07T04:16:38.509Z"
}));

console.log("✅ AI insights loaded for Weeks 1 & 3");

console.log("\n📊 EXPECTED RESULTS:");
console.log("Week 3: Sep 29 - Oct 5 (AI Analysis) ✅");
console.log("Week 2: Sep 22 - Sep 28 (Empty Placeholder) 📝");
console.log("Week 1: Sep 15 - Sep 21 (AI Analysis) ✅");

console.log("\n🔍 WHAT TO CHECK:");
console.log("1. Weekly Summary tab should show all 3 weeks");
console.log("2. Week 2 should have dashed border and 'No entries' message");
console.log("3. AI Analysis tab should show Weeks 1 & 3 with analysis");
console.log("4. Week 2 should show 'No Emotion Data This Week' placeholder");
console.log("5. Empty weeks should have 'Start Logging' buttons");

window.location.reload();