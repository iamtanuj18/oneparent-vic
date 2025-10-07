import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';

interface MoodSliderProps {
  title: string;
  value: number;
  onChange: (value: number) => void;
  icon: string;
  color: 'blue' | 'red';
}

export function MoodSlider({ title, value, onChange, icon, color }: MoodSliderProps) {
  const getSliderColor = () => {
    if (color === 'blue') {
      return 'bg-blue-500';
    }
    return 'bg-red-500';
  };

  const getTrackColor = () => {
    if (color === 'blue') {
      return 'bg-blue-100';
    }
    return 'bg-red-100';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="px-2">
          <Slider
            value={[value]}
            onValueChange={(values) => onChange(values[0])}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Not set</span>
          <span>0%</span>
          <span>20%</span>
          <span>40%</span>
          <span>60%</span>
          <span>80%</span>
          <span>100%</span>
        </div>
        
        <div className="text-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            color === 'blue' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {value}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}