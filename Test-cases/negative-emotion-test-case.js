// Test Case: Predominantly Negative Emotions (Extreme Negative Days Included, 3 Weeks)

localStorage.setItem("user-emotion-start-date", "2025-09-15");

localStorage.setItem("emotion-logs", JSON.stringify([
  // Week 1
  {"id": "1757937600000", "date": "Mon Sep 15 2025", "timestamp": 1757937600000, "mood": 1, "energy": 5, "overwhelm": 95, "emotions": ["angry", "anxious", "frustrated", "sad", "tired", "lonely", "ashamed"], "week": 1},
  {"id": "1758024000000", "date": "Tue Sep 16 2025", "timestamp": 1758024000000, "mood": 2, "energy": 20, "overwhelm": 80, "emotions": ["numb", "worried", "impatient"], "week": 1},
  {"id": "1758110400000", "date": "Wed Sep 17 2025", "timestamp": 1758110400000, "mood": 1, "energy": 10, "overwhelm": 92, "emotions": ["grumpy", "disgusted", "insecure", "confused", "weak", "bored"], "week": 1},
  {"id": "1758196800000", "date": "Thu Sep 18 2025", "timestamp": 1758196800000, "mood": 2, "energy": 25, "overwhelm": 75, "emotions": ["sad", "tired", "unmotivated"], "week": 1},
  {"id": "1758283200000", "date": "Fri Sep 19 2025", "timestamp": 1758283200000, "mood": 2, "energy": 30, "overwhelm": 70, "emotions": ["lonely", "worried", "nervous"], "week": 1},
  {"id": "1758369600000", "date": "Sat Sep 20 2025", "timestamp": 1758369600000, "mood": 2, "energy": 35, "overwhelm": 65, "emotions": ["ashamed", "confused", "impatient"], "week": 1},

  // Week 2
  {"id": "1758542400000", "date": "Mon Sep 22 2025", "timestamp": 1758542400000, "mood": 1, "energy": 8, "overwhelm": 97, "emotions": ["frustrated", "angry", "anxious", "sad", "tired", "weak", "lonely"], "week": 2},
  {"id": "1758628800000", "date": "Tue Sep 23 2025", "timestamp": 1758628800000, "mood": 2, "energy": 20, "overwhelm": 80, "emotions": ["nervous", "bored", "confused"], "week": 2},
  {"id": "1758715200000", "date": "Wed Sep 24 2025", "timestamp": 1758715200000, "mood": 2, "energy": 25, "overwhelm": 75, "emotions": ["sad", "lonely", "impatient"], "week": 2},
  {"id": "1758801600000", "date": "Thu Sep 25 2025", "timestamp": 1758801600000, "mood": 1, "energy": 5, "overwhelm": 95, "emotions": ["disgusted", "grumpy", "ashamed", "anxious", "worried", "tired"], "week": 2},
  {"id": "1758888000000", "date": "Fri Sep 26 2025", "timestamp": 1758888000000, "mood": 2, "energy": 30, "overwhelm": 70, "emotions": ["unmotivated", "numb", "weak"], "week": 2},
  {"id": "1758974400000", "date": "Sat Sep 27 2025", "timestamp": 1758974400000, "mood": 2, "energy": 35, "overwhelm": 65, "emotions": ["sad", "confused", "impatient"], "week": 2},

  // Week 3
  {"id": "1759147200000", "date": "Mon Sep 29 2025", "timestamp": 1759147200000, "mood": 2, "energy": 25, "overwhelm": 75, "emotions": ["sad", "tired", "nervous"], "week": 3},
  {"id": "1759233600000", "date": "Tue Sep 30 2025", "timestamp": 1759233600000, "mood": 1, "energy": 5, "overwhelm": 95, "emotions": ["frustrated", "angry", "anxious", "lonely", "ashamed", "weak"], "week": 3},
  {"id": "1759320000000", "date": "Wed Oct 01 2025", "timestamp": 1759320000000, "mood": 2, "energy": 20, "overwhelm": 80, "emotions": ["bored", "confused", "numb"], "week": 3},
  {"id": "1759406400000", "date": "Thu Oct 02 2025", "timestamp": 1759406400000, "mood": 2, "energy": 30, "overwhelm": 70, "emotions": ["sad", "tired", "impatient"], "week": 3},
  {"id": "1759492800000", "date": "Fri Oct 03 2025", "timestamp": 1759492800000, "mood": 2, "energy": 35, "overwhelm": 65, "emotions": ["nervous", "ashamed", "weak"], "week": 3},
  {"id": "1759579200000", "date": "Sat Oct 04 2025", "timestamp": 1759579200000, "mood": 1, "energy": 10, "overwhelm": 92, "emotions": ["angry", "disgusted", "frustrated", "sad", "tired", "lonely"], "week": 3}
]));

localStorage.setItem("emotion-insights-generated", JSON.stringify([]));

console.log(" Emotion Tracker Test Case 3 (Extreme Negative Emotions) injected successfully!");
