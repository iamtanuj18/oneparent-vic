// Test Case 2: With Ai Insights for week 1 only. Weeks 2 and 3 are empty

localStorage.setItem("user-emotion-start-date", "2025-09-15");

localStorage.setItem("emotion-logs", JSON.stringify([
  {"id": "1757937600000", "date": "Mon Sep 15 2025", "timestamp": 1757937600000, "mood": 4, "energy": 70, "overwhelm": 30, "emotions": ["excited", "motivated"], "sleepHours": 7.0, "activities": ["worked_personal_goal"], "week": 1},
  {"id": "1758024000000", "date": "Tue Sep 16 2025", "timestamp": 1758024000000, "mood": 3, "energy": 60, "overwhelm": 40, "emotions": ["average", "nervous"], "sleepHours": 6.0, "activities": ["worked_personal_goal"], "week": 1},
  {"id": "1758110400000", "date": "Wed Sep 17 2025", "timestamp": 1758110400000, "mood": 5, "energy": 80, "overwhelm": 20, "emotions": ["joyful", "grateful"], "sleepHours": 7.5, "activities": ["connected_friends_family", "self_care"], "week": 1},
  {"id": "1758196800000", "date": "Thu Sep 18 2025", "timestamp": 1758196800000, "mood": 4, "energy": 65, "overwhelm": 35, "emotions": ["accomplished", "productive"], "sleepHours": 6.5, "activities": ["worked_personal_goal"], "week": 1},
  {"id": "1758283200000", "date": "Fri Sep 19 2025", "timestamp": 1758283200000, "mood": 3, "energy": 50, "overwhelm": 50, "emotions": ["tired", "anxious"], "sleepHours": 5.5, "activities": [], "week": 1},
  {"id": "1758369600000", "date": "Sat Sep 20 2025", "timestamp": 1758369600000, "mood": 4, "energy": 75, "overwhelm": 25, "emotions": ["relaxed", "calm"], "sleepHours": 8.0, "activities": ["relaxed_rested", "quality_time_kids"], "week": 1},

  {"id": "1758542400000", "date": "Mon Sep 22 2025", "timestamp": 1758542400000, "mood": 3, "energy": 55, "overwhelm": 45, "emotions": ["anxious", "worried"], "sleepHours": 6.0, "activities": ["worked_personal_goal"], "week": 2},
  {"id": "1758628800000", "date": "Tue Sep 23 2025", "timestamp": 1758628800000, "mood": 4, "energy": 70, "overwhelm": 30, "emotions": ["motivated", "active"], "sleepHours": 7.0, "activities": ["worked_personal_goal"], "week": 2},
  {"id": "1758715200000", "date": "Wed Sep 24 2025", "timestamp": 1758715200000, "mood": 2, "energy": 40, "overwhelm": 70, "emotions": ["sad", "frustrated"], "sleepHours": 5.0, "activities": [], "week": 2},
  {"id": "1758888000000", "date": "Fri Sep 26 2025", "timestamp": 1758888000000, "mood": 4, "energy": 60, "overwhelm": 40, "emotions": ["average", "calm"], "sleepHours": 7.0, "activities": ["relaxed_rested"], "week": 2},
  {"id": "1758974400000", "date": "Sat Sep 27 2025", "timestamp": 1758974400000, "mood": 5, "energy": 80, "overwhelm": 20, "emotions": ["loved", "appreciated"], "sleepHours": 8.0, "activities": ["connected_friends_family", "quality_time_kids"], "week": 2},

  {"id": "1759147200000", "date": "Mon Sep 29 2025", "timestamp": 1759147200000, "mood": 3, "energy": 50, "overwhelm": 50, "emotions": ["average", "tired"], "sleepHours": 6.0, "activities": ["worked_personal_goal"], "week": 3},
  {"id": "1759233600000", "date": "Tue Sep 30 2025", "timestamp": 1759233600000, "mood": 4, "energy": 75, "overwhelm": 25, "emotions": ["accomplished", "grateful"], "sleepHours": 7.5, "activities": ["worked_personal_goal"], "week": 3},
  {"id": "1759406400000", "date": "Thu Oct 02 2025", "timestamp": 1759406400000, "mood": 5, "energy": 85, "overwhelm": 15, "emotions": ["joyful", "active"], "sleepHours": 8.0, "activities": ["exercised", "self_care"], "week": 3},
  {"id": "1759579200000", "date": "Sat Oct 04 2025", "timestamp": 1759579200000, "mood": 4, "energy": 65, "overwhelm": 35, "emotions": ["thankful", "calm"], "sleepHours": 7.5, "activities": ["relaxed_rested", "quality_time_kids"], "week": 3}
]));

localStorage.setItem("emotion-insights-generated", JSON.stringify([1]));

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

console.log(" Emotion Tracker Test 2 data injected successfully!");
