// ✅ TEST CASE: Validate Week Calculation Fixes
// Run this in browser console to test the emotion tracker fixes

console.log("🧪 TESTING EMOTION TRACKER FIXES");
console.log("================================");

// Clear existing data
localStorage.clear();
console.log("✅ Cleared localStorage");

// Set up test data with proper 2025 timestamps
localStorage.setItem("user-emotion-start-date", "2025-09-15");

// Generate proper 2025 timestamps
const testLogs = [
  // Week 1: Sep 15-21, 2025
  {id: "sep15", date: "Mon Sep 15 2025", timestamp: new Date("2025-09-15T12:00:00Z").getTime(), mood: 4, energy: 70, overwhelm: 30, emotions: ["excited", "motivated"], week: 1},
  {id: "sep16", date: "Tue Sep 16 2025", timestamp: new Date("2025-09-16T12:00:00Z").getTime(), mood: 3, energy: 60, overwhelm: 40, emotions: ["okay", "busy"], week: 1},
  {id: "sep17", date: "Wed Sep 17 2025", timestamp: new Date("2025-09-17T12:00:00Z").getTime(), mood: 5, energy: 80, overwhelm: 20, emotions: ["joyful", "grateful"], week: 1},
  
  // Week 2: Sep 22-28, 2025  
  {id: "sep22", date: "Mon Sep 22 2025", timestamp: new Date("2025-09-22T12:00:00Z").getTime(), mood: 3, energy: 55, overwhelm: 45, emotions: ["anxious", "overwhelmed"], week: 2},
  {id: "sep24", date: "Wed Sep 24 2025", timestamp: new Date("2025-09-24T12:00:00Z").getTime(), mood: 2, energy: 40, overwhelm: 70, emotions: ["sad", "frustrated"], week: 2},
  
  // Week 3: Sep 29 - Oct 5, 2025
  {id: "sep29", date: "Mon Sep 29 2025", timestamp: new Date("2025-09-29T12:00:00Z").getTime(), mood: 3, energy: 50, overwhelm: 50, emotions: ["routine", "normal"], week: 3},
  {id: "oct2", date: "Thu Oct 02 2025", timestamp: new Date("2025-10-02T12:00:00Z").getTime(), mood: 5, energy: 85, overwhelm: 15, emotions: ["joyful", "energized"], week: 3},
  
  // Week 4: Oct 6-12, 2025 (THIS IS THE CRITICAL TEST)
  {id: "oct7", date: "Tue Oct 07 2025", timestamp: new Date("2025-10-07T12:00:00Z").getTime(), mood: 4, energy: 75, overwhelm: 25, emotions: ["satisfied", "proud"], week: 4}
];

localStorage.setItem("emotion-logs", JSON.stringify(testLogs));
console.log("✅ Test data loaded");

// Test week calculation logic
const getWeekNumber = (date, firstLogDate) => {
  const startOfFirstWeek = new Date(firstLogDate);
  startOfFirstWeek.setDate(firstLogDate.getDate() - firstLogDate.getDay() + 1);
  
  const startOfCurrentWeek = new Date(date);
  startOfCurrentWeek.setDate(date.getDate() - date.getDay() + 1);
  
  const diffTime = startOfCurrentWeek.getTime() - startOfFirstWeek.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  
  return Math.max(1, diffWeeks + 1);
};

console.log("\n📊 WEEK CALCULATION VALIDATION:");
const oct7Date = new Date("2025-10-07T12:00:00Z");
const startDate = new Date("2025-09-15");
const calculatedWeek = getWeekNumber(oct7Date, startDate);

console.log(`Oct 7, 2025 should be Week 4: ${calculatedWeek === 4 ? '✅ PASS' : '❌ FAIL'} (got Week ${calculatedWeek})`);

console.log("\n📅 EXPECTED WEEK RANGES:");
const mondayOfFirstWeek = new Date("2025-09-15");
for (let week = 1; week <= 4; week++) {
  const weekStart = new Date(mondayOfFirstWeek);
  weekStart.setDate(mondayOfFirstWeek.getDate() + (week - 1) * 7);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  console.log(`Week ${week}: ${weekStart.toDateString()} - ${weekEnd.toDateString()}`);
  
  if (week === 4) {
    const oct7Falls = oct7Date >= weekStart && oct7Date <= weekEnd;
    console.log(`  → Oct 7 falls in Week 4: ${oct7Falls ? '✅ CORRECT' : '❌ WRONG'}`);
  }
}

console.log("\n🔄 Now refresh the page and check:");
console.log("1. Weekly Summary should show Oct 7 in Week 4 (Oct 6 - Oct 12)");
console.log("2. Week ranges should be correct for all weeks");
console.log("3. Try adding a new entry for today - it should get the right week number");

window.location.reload();