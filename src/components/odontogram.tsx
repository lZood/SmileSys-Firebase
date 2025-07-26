'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from './ui/button';

type Condition = 'healthy' | 'caries' | 'restoration' | 'missing' | 'endo';
type ToothState = { [key: string]: Condition };

const conditions: { id: Condition; label: string; color: string }[] = [
  { id: 'healthy', label: 'Healthy', color: 'fill-white' },
  { id: 'caries', label: 'Caries', color: 'fill-red-500' },
  { id: 'restoration', label: 'Restoration', color: 'fill-blue-500' },
  { id: 'endo', label: 'Endodontics', color: 'fill-yellow-400' },
  { id: 'missing', label: 'Missing', color: 'fill-gray-500' },
];

const toothNumbers = {
  upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
  upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
  lowerLeft: ['31', '32', '33', '34', '35', '36', '37', '38'],
  lowerRight: ['48', '47', '46', '45', '44', '43', '42', '41'],
};

const Tooth = ({ id, condition, onConditionChange }: { id: string; condition: Condition; onConditionChange: (id: string, condition: Condition) => void; }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const currentCondition = conditions.find(c => c.id === condition) || conditions[0];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex flex-col items-center group">
          <svg width="40" height="50" viewBox="0 0 40 50" className="cursor-pointer">
            <path d="M10 10 C 10 0, 30 0, 30 10 L 30 30 C 30 45, 25 45, 25 45 L 23 30 L 17 30 L 15 45 C 15 45, 10 45, 10 30 Z" 
              className={cn('stroke-gray-600 stroke-2 group-hover:stroke-primary transition-all', currentCondition.color)}
            />
          </svg>
          <span className="text-xs font-semibold text-muted-foreground">{id}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Tooth {id}</h4>
            <p className="text-sm text-muted-foreground">Select the condition.</p>
          </div>
          <RadioGroup defaultValue={condition} onValueChange={(value) => onConditionChange(id, value as Condition)}>
            {conditions.map(c => (
              <div key={c.id} className="flex items-center space-x-2">
                <RadioGroupItem value={c.id} id={`cond-${id}-${c.id}`} />
                <Label htmlFor={`cond-${id}-${c.id}`}>{c.label}</Label>
              </div>
            ))}
          </RadioGroup>
          <Button onClick={() => setIsOpen(false)} size="sm">Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export function Odontogram() {
  const [toothState, setToothState] = React.useState<ToothState>(() => {
    const initialState: ToothState = {};
    Object.values(toothNumbers).flat().forEach(num => {
      initialState[num] = 'healthy';
    });
    initialState['16'] = 'caries';
    initialState['26'] = 'restoration';
    initialState['46'] = 'missing';
    return initialState;
  });

  const handleConditionChange = (id: string, condition: Condition) => {
    setToothState(prev => ({ ...prev, [id]: condition }));
  };

  const renderQuadrant = (quadrant: string[]) => (
    <div className="flex justify-center space-x-1">
      {quadrant.map(num => (
        <Tooth key={num} id={num} condition={toothState[num]} onConditionChange={handleConditionChange} />
      ))}
    </div>
  );

  return (
    <div className="p-4 bg-card rounded-lg border">
        <div className="flex flex-col gap-2">
            {renderQuadrant(toothNumbers.upperRight.slice().reverse())}
            {renderQuadrant(toothNumbers.upperLeft)}
        </div>
        <hr className="my-4 border-dashed" />
        <div className="flex flex-col gap-2">
            {renderQuadrant(toothNumbers.lowerLeft)}
            {renderQuadrant(toothNumbers.lowerRight.slice().reverse())}
        </div>
    </div>
  );
}
