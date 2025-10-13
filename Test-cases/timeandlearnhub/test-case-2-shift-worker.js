/**
 * TIME & LEARN HUB - TEST CASE 2: SHIFT WORKER WITH IRREGULAR SCHEDULE
 * 
 * SCENARIO: Healthcare worker with rotating shifts (day/night/weekend)
 * EXPECTED FREE TIME POCKETS: Irregular but significant chunks between shifts
 * GEMINI ANALYSIS TARGET: Should identify varying patterns and suggest flexible learning
 */

const testCase2 = {
  title: "Healthcare Shift Worker - Rotating Schedule",
  description: "Nurse working rotating 12-hour shifts with irregular days off",
  
  schedule: {
    monday: `
5:30am wake up early for day shift
6:30am drive to the hospital
7am start my 12 hour shift
12pm lunch break
7pm shift finally ends
7:30pm drive home exhausted
8pm dinner
8:30pm shower and decompress
9pm some personal time to relax
11pm sleep need rest for tomorrow
    `,
    
    tuesday: `
5:30am wake up for another day shift
6:30am commute to hospital
7am start work
12pm lunch break
7pm shift ends
7:30pm drive home
8pm eat dinner
8:30pm shower and unwind
9pm personal time 
11pm sleep
    `,
    
    wednesday: `
day off finally can sleep in
8am wake up feeling rested
9am coffee and breakfast
10am work on personal projects
2pm lunch
3pm run errands grocery shopping appointments
5pm go to the gym
6:30pm dinner
7:30pm video call with family
8:30pm more personal time
11:30pm sleep
    `,
    
    thursday: `
another day off
9am wake up extra rest
10am breakfast
11am free time for learning or hobbies
4pm late lunch
5pm personal appointments dentist etc
6:30pm cook dinner
7:30pm relax and hobbies
8:30pm personal time
11pm sleep preparing for night shift
    `,
    
    friday: `
6pm wake up for night shift
7pm eat dinner
7:30pm get ready for work
8:30pm drive to hospital
9pm start night shift 12 hours
2am short break
9am shift ends saturday morning
9:30am drive home tired
10am quick breakfast
10:30am sleep all day
    `,
    
    saturday: `
6pm wake up for another night shift
7pm dinner
7:30pm get ready for night work
8:30pm commute to hospital
9pm night shift starts
2am break time
9am shift ends sunday morning
9:30am drive home
10am eat something quick
10:30am sleep
    `,
    
    sunday: `
4pm wake up from sleeping all day
5pm brunch late meal
6pm personal time finally free
11pm light dinner
11:30pm get ready for day shifts next week
12am sleep
    `
  },
  
  expectedFreeTimePockets: [
    {
      day: "Monday-Tuesday",
      time: "9:00 PM - 11:00 PM", 
      duration: "2 hours each",
      type: "Post-shift wind down learning",
      suitability: "Light reading, podcasts, relaxed courses"
    },
    {
      day: "Wednesday", 
      time: "10:00 AM - 2:00 PM",
      duration: "4 hours",
      type: "Day off morning intensive", 
      suitability: "Deep focus work, comprehensive courses, projects"
    },
    {
      day: "Wednesday",
      time: "8:30 PM - 11:30 PM",
      duration: "3 hours", 
      type: "Day off evening session",
      suitability: "Creative work, skill practice, course completion"
    },
    {
      day: "Thursday",
      time: "11:00 AM - 4:00 PM", 
      duration: "5 hours",
      type: "Full day off intensive learning",
      suitability: "Major projects, certification courses, hands-on practice"
    },
    {
      day: "Thursday", 
      time: "8:30 PM - 11:00 PM",
      duration: "2.5 hours",
      type: "Pre-night shift session", 
      suitability: "Prep work, lighter learning, review"
    },
    {
      day: "Friday-Saturday",
      time: "2:00 AM - 2:30 AM",
      duration: "30 minutes each",
      type: "Night shift break learning",
      suitability: "Quick skills, mobile learning, micro-courses"
    },
    {
      day: "Sunday",
      time: "6:00 PM - 11:00 PM",
      duration: "5 hours", 
      type: "Recovery day learning block",
      suitability: "Flexible learning, catch-up, planning"
    }
  ],
  
  totalWeeklyFreeTime: "24 hours",
  
  expectedLearningRecommendations: {
    shiftPattern: "Leverage full days off for intensive learning blocks",
    workDayPattern: "Light 2-hour sessions after day shifts only", 
    nightShiftStrategy: "Micro-learning during breaks, avoid heavy learning",
    bestDays: ["Wednesday", "Thursday", "Sunday"],
    avoidDays: ["Friday-Saturday nights", "Recovery periods"],
    flexibilityNeeded: "High - schedule changes frequently"
  },
  
  validationCriteria: {
    shouldIdentifyDayOffAdvantage: true,
    shouldCautionAgainstNightShiftLearning: true,
    shouldRecommendFlexibleScheduling: true, 
    shouldIdentifyRecoveryNeeds: true,
    shouldSuggestIntensiveBlocks: true,
    totalFreeTimeRange: "20-26 hours per week"
  }
}

module.exports = testCase2

