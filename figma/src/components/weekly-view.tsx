import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Calendar, TrendingUp, Brain, Clock } from 'lucide-react';
import { WeekSummary } from './emotion-logger';

interface WeeklyViewProps {
  weekSummaries: WeekSummary[];
}

const MOOD_EMOJIS = ['😢', '😟', '😐', '🙂', '😊', '😄'];
const MOOD_LABELS = ['Very Sad', 'Sad', 'Neutral', 'Good', 'Happy', 'Very Happy'];

export function WeeklyView({ weekSummaries }: WeeklyViewProps) {
  if (weekSummaries.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg mb-2">No data yet</h3>
          <p className="text-muted-foreground">
            Start logging your daily emotions to see weekly summaries and insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getMoodEmoji = (avgMood: number) => {
    const index = Math.round(avgMood) - 1;
    return MOOD_EMOJIS[Math.max(0, Math.min(5, index))];
  };

  const getMoodLabel = (avgMood: number) => {
    const index = Math.round(avgMood) - 1;
    return MOOD_LABELS[Math.max(0, Math.min(5, index))];
  };

  const getEmotionColor = (emotion: string) => {
    const positiveEmotions = ['excited', 'amazed', 'joyful', 'grateful', 'loved', 'accomplished', 'appreciated', 'thankful', 'worthy'];
    const productiveEmotions = ['productive', 'motivated', 'active', 'relaxed', 'refreshed', 'calm'];
    const negativeEmotions = ['angry', 'anxious', 'disgusted', 'frustrated', 'annoyed', 'grumpy'];
    
    if (positiveEmotions.includes(emotion)) {
      return 'bg-orange-100 text-orange-800';
    } else if (productiveEmotions.includes(emotion)) {
      return 'bg-green-100 text-green-800';
    } else if (negativeEmotions.includes(emotion)) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl mb-2">Weekly Emotion Summary</h2>
        <p className="text-muted-foreground">
          Track your emotional patterns and growth over time
        </p>
      </div>

      {weekSummaries.map((week) => (
        <Card key={week.weekNumber} className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Week {week.weekNumber}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {formatDateRange(week.startDate, week.endDate)}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {week.logs.length} entries
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {/* Mood Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="text-4xl">{getMoodEmoji(week.avgMood)}</div>
                <div className="text-sm text-muted-foreground">Average Mood</div>
                <div>{getMoodLabel(week.avgMood)}</div>
                <div className="text-sm text-muted-foreground">({week.avgMood}/6)</div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Energy Level</span>
                    <span>{week.avgEnergy}%</span>
                  </div>
                  <Progress value={week.avgEnergy} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overwhelm Level</span>
                    <span>{week.avgOverwhelm}%</span>
                  </div>
                  <Progress value={week.avgOverwhelm} className="h-2 [&>div]:bg-red-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Top Emotions</div>
                <div className="flex flex-wrap gap-1">
                  {week.dominantEmotions.map((emotion) => (
                    <Badge
                      key={emotion}
                      variant="secondary"
                      className={getEmotionColor(emotion)}
                    >
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Insights */}
            {week.insights && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm text-blue-900 mb-1">Weekly Insights</h4>
                    <p className="text-sm text-blue-800 leading-relaxed">{week.insights}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm text-muted-foreground">Daily Breakdown</h4>
              <div className="grid gap-2">
                {week.logs.sort((a, b) => a.timestamp - b.timestamp).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getMoodEmoji(log.mood)}</span>
                      <div>
                        <div className="text-sm">
                          {new Date(log.timestamp).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Energy: {log.energy}% • Overwhelm: {log.overwhelm}%
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {log.emotions.slice(0, 3).map((emotion) => (
                        <Badge
                          key={emotion}
                          variant="outline"
                          className={`text-xs ${getEmotionColor(emotion)}`}
                        >
                          {emotion}
                        </Badge>
                      ))}
                      {log.emotions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{log.emotions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}