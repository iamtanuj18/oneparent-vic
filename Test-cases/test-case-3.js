localStorage.setItem("user-emotion-start-date", "2025-09-15");

localStorage.setItem("emotion-logs", JSON.stringify([
  {"id": "1757937600000", "date": "Mon Sep 15 2025", "timestamp": 1757937600000, "mood": 4, "energy": 70, "overwhelm": 30, "emotions": ["excited", "motivated"], "week": 1},
  {"id": "1758024000000", "date": "Tue Sep 16 2025", "timestamp": 1758024000000, "mood": 3, "energy": 60, "overwhelm": 40, "emotions": ["okay", "busy"], "week": 1},
  {"id": "1758110400000", "date": "Wed Sep 17 2025", "timestamp": 1758110400000, "mood": 5, "energy": 80, "overwhelm": 20, "emotions": ["joyful", "grateful"], "week": 1},
  {"id": "1758196800000", "date": "Thu Sep 18 2025", "timestamp": 1758196800000, "mood": 4, "energy": 65, "overwhelm": 35, "emotions": ["confident", "productive"], "week": 1},
  {"id": "1758369600000", "date": "Sat Sep 20 2025", "timestamp": 1758369600000, "mood": 4, "energy": 75, "overwhelm": 25, "emotions": ["relaxed", "peaceful"], "week": 1},

  {"id": "1759147200000", "date": "Mon Sep 29 2025", "timestamp": 1759147200000, "mood": 3, "energy": 50, "overwhelm": 50, "emotions": ["routine", "normal"], "week": 3},
  {"id": "1759233600000", "date": "Tue Sep 30 2025", "timestamp": 1759233600000, "mood": 4, "energy": 75, "overwhelm": 25, "emotions": ["accomplished", "proud"], "week": 3},
  {"id": "1759579200000", "date": "Sat Oct 04 2025", "timestamp": 1759579200000, "mood": 4, "energy": 65, "overwhelm": 35, "emotions": ["satisfied", "calm"], "week": 3}
]));

localStorage.setItem("emotion-insights-generated", JSON.stringify([1,3]));

localStorage.setItem("emotion-insights-week-1", JSON.stringify({
  "analysis": {
    "weeklyOverview": "This week showed a good balance of positive emotions like excitement and motivation, with moments of joy and peace. While there were a few dips, your overall mood remained relatively stable, which is a great accomplishment as a single parent.",
    "emotionalPatterns": [
      "Your mood generally stayed in the mid-range, indicating a steady emotional state throughout the week.",
      "Energy levels fluctuated but were generally moderate, with a noticeable dip on Friday.",
      "Overwhelm levels remained relatively low, suggesting you managed your responsibilities well."
    ],
    "keyInsights": [
      "You experienced a good range of positive emotions, including excitement, motivation, joy, and peace.",
      "Despite the demands of single parenting, you maintained a generally stable mood.",
      "There's a clear connection between higher energy and lower overwhelm, and vice versa."
    ],
    "progressComparison": "No previous week data available.",
    "personalizedTips": [
      "Schedule short, restorative breaks during your day, even just 5-10 minutes, to recharge.",
      "When you feel overwhelmed, try deep breathing exercises or a quick walk to reset.",
      "Celebrate small wins and acknowledge your efforts, as these are significant achievements."
    ],
    "concernAreas": [],
    "positiveHighlights": [
      "Experiencing feelings of joy and gratitude on Wednesday.",
      "Ending the week with feelings of relaxation and peace on Saturday."
    ],
    "nextWeekFocus": "Focus on maintaining your energy levels, perhaps by prioritizing sleep or finding small moments of calm."
  },
  "generatedAt": "2025-10-07T04:16:32.370Z"
}));

localStorage.setItem("emotion-insights-week-3", JSON.stringify({
  "analysis": {
    "weeklyOverview": "This week has been a journey of steady improvement, with your mood and energy levels showing a positive upward trend. You've navigated your days with a sense of accomplishment and calm, which is wonderful!",
    "emotionalPatterns": [
      "Your mood has shown a consistent improvement throughout the week.",
      "Energy levels have been moderate, with a good recovery towards the end of the week.",
      "Overwhelm has remained at a low level, indicating good coping mechanisms."
    ],
    "keyInsights": [
      "You're successfully managing the daily 'routine' while also finding moments of feeling 'accomplished' and 'proud'.",
      "The dip in energy on Monday was followed by a strong recovery, showing resilience.",
      "Maintaining low overwhelm levels is a great sign of balance, even with parenting demands."
    ],
    "progressComparison": "This week saw an improvement in your average mood from 3.83/6 to 4/6, and your energy levels increased from 66.7/100 to 68.75/100. Your overwhelm also decreased from 33.3/100 to 31.25/100, showing great progress!",
    "personalizedTips": [
      "Schedule small pockets of 'me-time' even for just 10-15 minutes to recharge.",
      "Celebrate small wins, like getting through a busy day or a child's milestone, to boost feelings of accomplishment.",
      "When feeling a dip in energy, try a short walk or some stretching to help re-energize."
    ],
    "concernAreas": [],
    "positiveHighlights": [
      "Feeling 'joyful' and 'energized' on Thursday.",
      "Experiencing a sense of being 'calm' and 'satisfied' on Saturday."
    ],
    "nextWeekFocus": "Continue to acknowledge and build on the feelings of accomplishment and joy you've experienced this week."
  },
  "generatedAt": "2025-10-07T04:16:38.509Z"
}));

console.log(" Emotion Tracker Test Case (Weeks 1 & 3) data injected successfully!");
