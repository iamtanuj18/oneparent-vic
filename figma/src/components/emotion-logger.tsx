import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Calendar, Clock, TrendingUp, Brain } from 'lucide-react';
import { MoodSlider } from './mood-slider';
import { EmotionInput } from './emotion-input';
import { WeeklyView } from './weekly-view';

export interface EmotionLog {
  id: string;
  date: string;
  timestamp: number;
  mood: number; // 1-6 scale
  energy: number; // 0-100
  overwhelm: number; // 0-100
  emotions: string[];
  week: number;
}

export interface WeekSummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  logs: EmotionLog[];
  avgMood: number;
  avgEnergy: number;
  avgOverwhelm: number;
  dominantEmotions: string[];
  insights?: string;
}

const MOOD_EMOJIS = ['😢', '😟', '😐', '🙂', '😊', '😄'];
const MOOD_LABELS = ['Very Sad', 'Sad', 'Neutral', 'Good', 'Happy', 'Very Happy'];

export function EmotionLogger() {
  const [mood, setMood] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(50);
  const [overwhelm, setOverwhelm] = useState<number>(50);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [logs, setLogs] = useState<EmotionLog[]>([]);
  const [weekSummaries, setWeekSummaries] = useState<WeekSummary[]>([]);
  const [todayLogged, setTodayLogged] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('emotion-logs');
    if (savedLogs) {
      const parsedLogs = JSON.parse(savedLogs);
      setLogs(parsedLogs);
      generateWeekSummaries(parsedLogs);
      checkIfTodayLogged(parsedLogs);
    }
  }, []);

  const checkIfTodayLogged = (logs: EmotionLog[]) => {
    const today = new Date().toDateString();
    const todayLog = logs.find(log => new Date(log.timestamp).toDateString() === today);
    setTodayLogged(!!todayLog);
  };

  const getWeekNumber = (date: Date, firstLogDate: Date): number => {
    const startOfFirstWeek = new Date(firstLogDate);
    startOfFirstWeek.setDate(firstLogDate.getDate() - firstLogDate.getDay() + 1); // Monday of first week
    
    const startOfCurrentWeek = new Date(date);
    startOfCurrentWeek.setDate(date.getDate() - date.getDay() + 1); // Monday of current week
    
    const diffTime = startOfCurrentWeek.getTime() - startOfFirstWeek.getTime();
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    
    return diffWeeks + 1;
  };

  const generateWeekSummaries = (logs: EmotionLog[]) => {
    if (logs.length === 0) return;

    const firstLog = logs.reduce((earliest, log) => 
      log.timestamp < earliest.timestamp ? log : earliest
    );
    const firstLogDate = new Date(firstLog.timestamp);

    const weekGroups = logs.reduce((groups, log) => {
      const week = getWeekNumber(new Date(log.timestamp), firstLogDate);
      if (!groups[week]) groups[week] = [];
      groups[week].push(log);
      return groups;
    }, {} as Record<number, EmotionLog[]>);

    const summaries = Object.entries(weekGroups).map(([weekNum, weekLogs]) => {
      const week = parseInt(weekNum);
      const sortedLogs = weekLogs.sort((a, b) => a.timestamp - b.timestamp);
      const firstLogOfWeek = new Date(sortedLogs[0].timestamp);
      const startOfWeek = new Date(firstLogOfWeek);
      startOfWeek.setDate(firstLogOfWeek.getDate() - firstLogOfWeek.getDay() + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const avgMood = weekLogs.reduce((sum, log) => sum + log.mood, 0) / weekLogs.length;
      const avgEnergy = weekLogs.reduce((sum, log) => sum + log.energy, 0) / weekLogs.length;
      const avgOverwhelm = weekLogs.reduce((sum, log) => sum + log.overwhelm, 0) / weekLogs.length;

      // Get most frequent emotions
      const emotionCounts = weekLogs.reduce((counts, log) => {
        log.emotions.forEach(emotion => {
          counts[emotion] = (counts[emotion] || 0) + 1;
        });
        return counts;
      }, {} as Record<string, number>);

      const dominantEmotions = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([emotion]) => emotion);

      return {
        weekNumber: week,
        startDate: startOfWeek.toDateString(),
        endDate: endOfWeek.toDateString(),
        logs: weekLogs,
        avgMood: Math.round(avgMood * 10) / 10,
        avgEnergy: Math.round(avgEnergy),
        avgOverwhelm: Math.round(avgOverwhelm),
        dominantEmotions,
        insights: generateInsights(week, avgMood, avgEnergy, avgOverwhelm, dominantEmotions)
      };
    }).sort((a, b) => b.weekNumber - a.weekNumber);

    setWeekSummaries(summaries);
  };

  const generateInsights = (week: number, avgMood: number, avgEnergy: number, avgOverwhelm: number, emotions: string[]): string => {
    // Mock AI insights based on data patterns
    let insights = [];

    if (avgMood >= 4.5) {
      insights.push("🌟 This was a particularly positive week for you!");
    } else if (avgMood <= 2.5) {
      insights.push("💙 It seems like this week was challenging. Remember that difficult periods are temporary.");
    }

    if (avgEnergy >= 70) {
      insights.push("⚡ Your energy levels were high this week - great job maintaining your vitality!");
    } else if (avgEnergy <= 30) {
      insights.push("🔋 Your energy was lower this week. Consider focusing on rest and self-care.");
    }

    if (avgOverwhelm >= 70) {
      insights.push("🧘 You felt quite overwhelmed this week. Try breaking tasks into smaller chunks and practicing mindfulness.");
    }

    if (emotions.includes('grateful') || emotions.includes('thankful')) {
      insights.push("🙏 Gratitude was a theme this week - this positive mindset can boost overall wellbeing.");
    }

    if (emotions.includes('anxious') || emotions.includes('worried')) {
      insights.push("💭 Consider implementing stress-reduction techniques like deep breathing or meditation.");
    }

    return insights.length > 0 ? insights.join(' ') : "Each week brings new experiences and growth opportunities. Keep tracking your emotions to understand your patterns better.";
  };

  const handleSubmit = () => {
    if (selectedEmotions.length === 0) {
      alert('Please select at least one emotion before logging.');
      return;
    }

    const now = new Date();
    const firstLogDate = logs.length > 0 
      ? new Date(logs.reduce((earliest, log) => log.timestamp < earliest.timestamp ? log : earliest).timestamp)
      : now;

    const weekNumber = getWeekNumber(now, firstLogDate);

    const newLog: EmotionLog = {
      id: Date.now().toString(),
      date: now.toDateString(),
      timestamp: now.getTime(),
      mood,
      energy,
      overwhelm,
      emotions: selectedEmotions,
      week: weekNumber
    };

    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    localStorage.setItem('emotion-logs', JSON.stringify(updatedLogs));
    
    generateWeekSummaries(updatedLogs);
    setTodayLogged(true);

    // Reset form
    setMood(3);
    setEnergy(50);
    setOverwhelm(50);
    setSelectedEmotions([]);
  };

  const getCurrentWeek = (): number => {
    if (logs.length === 0) return 1;
    const firstLogDate = new Date(logs.reduce((earliest, log) => 
      log.timestamp < earliest.timestamp ? log : earliest
    ).timestamp);
    return getWeekNumber(new Date(), firstLogDate);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl">Daily Emotion Logger</h1>
        <p className="text-muted-foreground">Track your daily emotions and see weekly patterns</p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Week {getCurrentWeek()}
          </div>
        </div>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">Today's Log</TabsTrigger>
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          {todayLogged && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700">
                  <Clock className="w-4 h-4" />
                  <span>You've already logged your emotions today! You can log again to update your entry.</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>How was your mood?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center gap-2">
                {MOOD_EMOJIS.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => setMood(index + 1)}
                    className={`p-3 rounded-full transition-all hover:scale-110 ${
                      mood === index + 1 
                        ? 'bg-primary text-primary-foreground scale-110' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    title={MOOD_LABELS[index]}
                  >
                    <span className="text-2xl">{emoji}</span>
                  </button>
                ))}
              </div>
              <div className="text-center mt-2 text-sm text-muted-foreground">
                {MOOD_LABELS[mood - 1]}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MoodSlider
              title="What was your energy level?"
              value={energy}
              onChange={setEnergy}
              icon="⚡"
              color="blue"
            />
            <MoodSlider
              title="How overwhelmed/busy were you?"
              value={overwhelm}
              onChange={setOverwhelm}
              icon="🔥"
              color="red"
            />
          </div>

          <EmotionInput
            selectedEmotions={selectedEmotions}
            onEmotionsChange={setSelectedEmotions}
          />

          <div className="flex justify-center">
            <Button 
              onClick={handleSubmit}
              size="lg"
              className="px-8"
              disabled={selectedEmotions.length === 0}
            >
              Log Today's Emotions
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="weekly">
          <WeeklyView weekSummaries={weekSummaries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}