/**
 * TIME & LEARN HUB - TEST CASE 1: BUSY WORKING PARENT
 * 
 * SCENARIO: Single parent with full-time job and young children
 * EXPECTED FREE TIME POCKETS: Early morning, lunch break, late evening
 * GEMINI ANALYSIS TARGET: Should identify 2-3 small learning windows
 */

const testCase1 = {
  title: "Busy Working Parent with Young Children",
  description: "Parent working 9-5 with school-age kids, minimal free time",
  
  // Complete weekly schedule
  schedule: {
    monday: `
6am wake up and shower
7am make breakfast for the kids
7:30am get kids dressed and ready for school
8am drop kids at school
8:30am drive to work
9am start work at the office
12pm lunch break - eat and have some free time
1pm back to work
5pm finish work and leave
5:30pm pick up kids from school
6pm grocery shopping with kids
7pm cook dinner
7:30pm family dinner time
8pm help kids with homework
8:30pm kids bath time
9pm put kids to bed
9:30pm clean up the house
10pm finally some me time
11pm go to sleep
    `,
    
    tuesday: `
6am wake up and get ready
7am breakfast for kids
7:30am get kids ready
8am school drop off
8:30am commute to work
9am work starts
12pm lunch break
1pm back to work
5pm leave work
5:30pm pick up kids
6pm take kids to soccer practice
7:30pm grab takeout for dinner
8pm homework time with kids
8:30pm bath time
9pm bedtime routine
9:30pm do some laundry
10pm personal time to relax
11pm sleep
    `,
    
    wednesday: `
6am wake up and shower
7am make breakfast
7:30am get kids ready for school
8am drop kids off
8:30am drive to work
9am start work
12pm lunch break
1pm back to work
5pm finish work
5:30pm pick up kids
6pm take youngest to doctor appointment
7:30pm cook dinner when we get home
8pm family dinner
8:30pm help with homework
9pm kids bath time
9:30pm bedtime stories
10pm some time for myself
11pm sleep
    `,
    
    thursday: `
6am wake up and get ready
7am breakfast time
7:30am get kids dressed
8am school drop off
8:30am commute to work
9am work day starts
12pm lunch break
1pm work continues
5pm leave work
5:30pm pick up kids
6pm take kids to piano lesson
7pm cook dinner
7:30pm family dinner
8pm homework help
8:30pm bath time
9pm bedtime routine
9:30pm prep stuff for tomorrow
10pm personal time
11pm go to bed
    `,
    
    friday: `
6am wake up and shower
7am breakfast for everyone
7:30am get kids ready
8am school drop off
8:30am drive to work
9am work starts
12pm lunch break
1pm back to work
5pm finish work
5:30pm pick up kids
6pm do the weekly grocery shopping
7:30pm pizza night and family movie
9pm put kids to bed
9:30pm plan weekend activities
10pm relax time
11pm sleep
    `,
    
    saturday: `
7am wake up (sleep in a bit)
8am family breakfast together
9am kids soccer games
11am playground time with the kids
12:30pm lunch out somewhere nice
2pm household chores with kids helping
4pm free time while kids play outside
6pm start cooking dinner
7pm family dinner
8pm family movie night
9:30pm kids bedtime routine
10pm finally some me time
11:30pm go to bed
    `,
    
    sunday: `
8am wake up and sleep in
9am big family breakfast
10am go to church
12pm make lunch at home
1pm family lunch
2pm quiet time - kids nap and i get some rest
3pm go to the park or take a walk
5pm meal prep for next week
6:30pm dinner
7:30pm kids bath and get ready for school week
8:30pm early bedtime for kids
9pm personal time to unwind
11pm sleep
    `
  },
  
  // Expected analysis results
  expectedFreeTimePockets: [
    {
      day: "Monday-Friday",
      time: "12:30 PM - 1:00 PM",
      duration: "30 minutes",
      type: "Lunch break micro-learning",
      suitability: "Quick reading, podcasts, mobile learning"
    },
    {
      day: "Monday-Friday", 
      time: "10:00 PM - 11:00 PM",
      duration: "1 hour",
      type: "Evening deep focus",
      suitability: "Online courses, skill development, creative work"
    },
    {
      day: "Saturday",
      time: "4:00 PM - 6:00 PM", 
      duration: "2 hours",
      type: "Weekend extended learning",
      suitability: "Project work, comprehensive courses, hands-on learning"
    },
    {
      day: "Saturday",
      time: "10:00 PM - 11:30 PM",
      duration: "1.5 hours", 
      type: "Weekend evening focus",
      suitability: "Reflection, planning, deeper learning"
    },
    {
      day: "Sunday",
      time: "2:00 PM - 3:00 PM",
      duration: "1 hour",
      type: "Quiet afternoon",
      suitability: "Reading, meditation, skill practice"
    },
    {
      day: "Sunday",
      time: "9:00 PM - 11:00 PM", 
      duration: "2 hours",
      type: "Sunday evening prep",
      suitability: "Course completion, week planning, reflection"
    }
  ],
  
  // Weekly learning time summary
  totalWeeklyFreeTime: "9 hours",
  
  // Learning recommendations Gemini should make
  expectedLearningRecommendations: {
    weekdayPattern: "Short 30-60 minute sessions during lunch and evening",
    weekendPattern: "Longer 1-2 hour focused sessions", 
    bestDays: ["Saturday", "Sunday"],
    challengingDays: ["Tuesday", "Wednesday", "Thursday"],
    microLearningOpportunities: ["Commute podcasts", "Lunch break reading", "Evening skill practice"]
  },
  
  // Test validation points
  validationCriteria: {
    shouldIdentifyLunchBreaks: true,
    shouldIdentifyEveningTime: true, 
    shouldIdentifyWeekendAdvantage: true,
    shouldSuggestMicroLearning: true,
    shouldRecommendFlexibleScheduling: true,
    totalFreeTimeRange: "8-10 hours per week"
  }
}

// Export for testing
module.exports = testCase1

