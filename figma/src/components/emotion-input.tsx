import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface EmotionInputProps {
  selectedEmotions: string[];
  onEmotionsChange: (emotions: string[]) => void;
}

const EMOTIONS = {
  positive: {
    label: 'Positive Emotions',
    color: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    selectedColor: 'bg-orange-500 text-white',
    emotions: [
      'excited', 'amazed', 'joyful', 'grateful', 'loved', 'accomplished',
      'appreciated', 'thankful', 'worthy'
    ]
  },
  productive: {
    label: 'Productive & Active',
    color: 'bg-green-100 text-green-800 hover:bg-green-200',
    selectedColor: 'bg-green-500 text-white',
    emotions: [
      'productive', 'motivated', 'active', 'relaxed', 'refreshed', 'calm'
    ]
  },
  neutral: {
    label: 'Neutral & Low Energy',
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    selectedColor: 'bg-blue-500 text-white',
    emotions: [
      'average', 'uneventful', 'sad', 'lonely', 'insecure', 'numb',
      'tired', 'unmotivated', 'nervous', 'bored', 'impatient', 'worried',
      'ashamed', 'confused', 'weak'
    ]
  },
  negative: {
    label: 'Negative & Intense',
    color: 'bg-red-100 text-red-800 hover:bg-red-200',
    selectedColor: 'bg-red-500 text-white',
    emotions: [
      'angry', 'anxious', 'disgusted', 'frustrated', 'annoyed', 'grumpy'
    ]
  }
};

export function EmotionInput({ selectedEmotions, onEmotionsChange }: EmotionInputProps) {
  const toggleEmotion = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      onEmotionsChange(selectedEmotions.filter(e => e !== emotion));
    } else {
      onEmotionsChange([...selectedEmotions, emotion]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>How did you feel?</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select all emotions that apply to your day. You can choose multiple emotions.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(EMOTIONS).map(([key, category]) => (
          <div key={key} className="space-y-3">
            <h4 className="text-sm text-muted-foreground">{category.label}</h4>
            <div className="flex flex-wrap gap-2">
              {category.emotions.map((emotion) => {
                const isSelected = selectedEmotions.includes(emotion);
                return (
                  <Badge
                    key={emotion}
                    variant="secondary"
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      isSelected ? category.selectedColor : category.color
                    }`}
                    onClick={() => toggleEmotion(emotion)}
                  >
                    {emotion}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
        
        {selectedEmotions.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm mb-2">Selected emotions ({selectedEmotions.length}):</h4>
            <div className="flex flex-wrap gap-2">
              {selectedEmotions.map((emotion) => (
                <Badge key={emotion} variant="default" className="bg-primary text-primary-foreground">
                  {emotion}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}