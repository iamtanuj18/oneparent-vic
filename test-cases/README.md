# Test Cases

Pre-built test data for Emotion Tracker and Time & Learn Hub features. Use these to test AI analysis without waiting for real data.

## Why These Exist

**Emotion Tracker** - Normally requires logging moods for a week before AI weekly analysis is available. Test cases let you skip the wait.

**Time & Learn Hub** - Works with user input anytime, but test cases provide realistic scenarios to see how AI analyzes different schedules.

## How to Use

### Emotion Tracker Test Cases

1. Go to Emotion Tracker page
2. Open browser console (F12)
3. Copy/paste a test case file content
4. Press Enter
5. Refresh the page
6. System thinks you've logged emotions for 3 weeks
7. Click "AI Weekly Analysis" to see insights

**Available Tests:**
- `test-case-1.js` - Balanced emotions with positive trend
- `test-case-2.js` - High stress parent with burnout signs
- `test-case-3.js` - Gradual improvement over weeks
- `test-case-4.js` - Inconsistent patterns needing attention
- `test-case-5.js` - Strong positive momentum
- `test-case-6.js` - Recovery from difficult period
- `negative-emotion-test-case.js` - Declining mental health indicators

### Time & Learn Hub Test Cases

1. Go to Time & Learn Hub page
2. Open browser console (F12)
3. Copy/paste a test case file content
4. Press Enter
5. System auto-fills schedule form
6. Click "Analyze My Schedule" for AI insights

**Available Tests:**
- `test-case-1-busy-parent.js` - Full-time job + young kids
- `test-case-2-shift-worker.js` - Irregular hours + childcare
- `test-case-3-student-worker.js` - Study + part-time work + parenting

## What Gets Injected

**Emotion Tracker:**
- 3 weeks of mood logs (15+ entries)
- Pre-generated AI weekly insights
- Start date and tracking metadata
- Ready for immediate analysis viewing

**Time & Learn Hub:**
- Complete 7-day schedule
- Realistic single parent scenarios
- Different life situations
- Ready for AI schedule analysis

## Clearing Test Data

**Emotion Tracker:**
- Click "Reset Progress" button on the page
- Or run in console: `localStorage.clear()`

**Time & Learn Hub:**
- Clear form and enter new schedule
- Or refresh page

## Testing the AI

After injecting test data, you can:
- View weekly analysis trends
- Test AI recommendation quality
- See pattern recognition
- Check UI with real data scenarios
- Validate backend API responses

No need to wait days/weeks for enough data!
