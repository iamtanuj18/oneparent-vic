/**
 * TIME & LEARN HUB - TEST CASE 3: UNIVERSITY STUDENT WITH PART-TIME JOB
 * 
 * SCENARIO: College student with irregular class times and part-time work
 * EXPECTED FREE TIME POCKETS: Gaps between classes, evenings, weekends
 * GEMINI ANALYSIS TARGET: Should identify study-friendly gaps and suggest skill-building
 */

const testCase3 = {
  title: "University Student with Part-Time Work",
  description: "Final year student working part-time with varied daily schedule",
  
  schedule: {
    monday: `
8am wake up
9am breakfast
10am advanced marketing class
11:30am free time between classes
1pm lunch
2pm statistics class
3:30pm free time before work
6pm start work at retail store
10pm finish work and commute home
10:30pm dinner
11pm study time
1am sleep
    `,
    
    tuesday: `
9am wake up
10am breakfast
11am research methods class
12:30pm long break no classes
4pm group project meeting
6pm dinner
7pm free time to chill
11pm study and homework
12:30am sleep
    `,
    
    wednesday: `
8am wake up
9am breakfast
10am business ethics class
11:30am break between classes
1pm lunch
2pm internship seminar
3pm free time before work
6pm work at retail store
10pm get home from work
10:30pm dinner
11pm study time
1am sleep
    `,
    
    thursday: `
10am wake up sleep in
11am breakfast
12pm free morning no classes
3pm strategic management class
4:30pm office hours with professor
5:30pm dinner
6:30pm study at library
10pm hang out with friends
11:30pm personal time
1am sleep
    `,
    
    friday: `
8am wake up
9am breakfast
10am international business class
11:30am free period
2pm lunch
3pm career services workshop
4pm free afternoon
6pm work at retail store
10pm get home
10:30pm weekend prep
11pm personal time
1am sleep
    `,
    
    saturday: `
10am wake up weekend sleep in
11am brunch
12pm free morning
4pm work weekend shift at store
8pm finish work
8:30pm dinner with friends
10pm social activities
11:30pm personal time
1am sleep
    `,
    
    sunday: `
11am wake up recovery day
12pm late breakfast
1pm plan for the week
3pm laundry and errands
4pm work on assignments
7pm dinner
8pm video call with family
9pm personal development time
12am sleep
    `
  },
  
  expectedFreeTimePockets: [
    {
      day: "Monday", 
      time: "11:30 AM - 1:00 PM",
      duration: "1.5 hours",
      type: "Between classes micro-session",
      suitability: "Quick skills, online tutorials, certification prep"
    },
    {
      day: "Monday",
      time: "3:30 PM - 6:00 PM", 
      duration: "2.5 hours",
      type: "Afternoon focus block",
      suitability: "Skill development, course modules, practical learning"
    },
    {
      day: "Monday, Wednesday",
      time: "11:00 PM - 1:00 AM",
      duration: "2 hours each", 
      type: "Late night deep work",
      suitability: "Intensive learning, coding, creative projects"
    },
    {
      day: "Tuesday",
      time: "12:30 PM - 4:00 PM",
      duration: "3.5 hours",
      type: "Midday intensive block", 
      suitability: "Major projects, comprehensive courses, skill building"
    },
    {
      day: "Tuesday", 
      time: "7:00 PM - 11:00 PM",
      duration: "4 hours",
      type: "Evening extended session",
      suitability: "Deep learning, project work, certification courses"
    },
    {
      day: "Thursday",
      time: "12:00 PM - 3:00 PM", 
      duration: "3 hours", 
      type: "Late morning block",
      suitability: "Focused learning, skill practice, course completion"
    },
    {
      day: "Thursday",
      time: "6:30 PM - 10:00 PM",
      duration: "3.5 hours",
      type: "Library-style study",
      suitability: "Structured learning, certification prep, skill development"
    },
    {
      day: "Sunday",
      time: "1:00 PM - 3:00 PM", 
      duration: "2 hours",
      type: "Week planning session",
      suitability: "Course planning, goal setting, learning strategy"
    },
    {
      day: "Sunday",
      time: "4:00 PM - 7:00 PM",
      duration: "3 hours", 
      type: "Sunday project time",
      suitability: "Major assignments, comprehensive learning, hands-on projects"
    },
    {
      day: "Sunday",
      time: "9:00 PM - 12:00 AM",
      duration: "3 hours",
      type: "Sunday evening focus", 
      suitability: "Week prep, skill development, creative work"
    }
  ],
  
  totalWeeklyFreeTime: "32 hours",
  
  expectedLearningRecommendations: {
    classGapStrategy: "Use 1-3 hour gaps between classes for focused skill sessions", 
    eveningPattern: "Leverage natural study habits for deep learning (7-11 PM)",
    weekendApproach: "Balance work shifts with intensive learning blocks",
    bestDays: ["Tuesday", "Thursday", "Sunday"], 
    microLearningDays: ["Monday", "Wednesday", "Friday"],
    energyOptimization: "Align intensive learning with natural study energy"
  },
  
  validationCriteria: {
    shouldIdentifyClassGaps: true,
    shouldLeverageStudyHabits: true,
    shouldBalanceWorkAndLearning: true,
    shouldSuggestEveningIntensive: true, 
    shouldRecommendWeekendProjects: true,
    totalFreeTimeRange: "28-35 hours per week"
  }
}

module.exports = testCase3

