
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

type Condition = 
  | 'healthy'
  | 'missing'
  | 'restoration'
  | 'caries'
  | 'trauma'
  | 'extraction'
  | 'fixed-prosthesis'
  | 'pain'
  | 'defective-restoration'
  | 'removable-prosthesis'
  | 'malocclusion'
  | 'mobility'
  | 'food-impaction';
  
type ToothState = { [key: string]: Condition };

const conditions: { id: Condition; label: string; color: string }[] = [
    { id: 'healthy', label: 'Sano', color: 'fill-white' },
    { id: 'missing', label: 'Ausente', color: 'fill-gray-500' },
    { id: 'restoration', label: 'Restauración', color: 'fill-blue-500' },
    { id: 'caries', label: 'Caries', color: 'fill-red-500' },
    { id: 'trauma', label: 'Traumatismo', color: 'fill-purple-500' },
    { id: 'extraction', label: 'Extracción', color: 'fill-black' },
    { id: 'fixed-prosthesis', label: 'Prótesis fija', color: 'fill-teal-500' },
    { id: 'pain', label: 'Dolor', color: 'fill-orange-500' },
    { id: 'defective-restoration', label: 'Restauracion defectuosa', color: 'fill-blue-200' },
    { id: 'removable-prosthesis', label: 'Protesis removible', color: 'fill-cyan-500' },
    { id: 'malocclusion', label: 'Mal oclusión', color: 'fill-pink-500' },
    { id: 'mobility', label: 'Movilidad', color: 'fill-indigo-500' },
    { id: 'food-impaction', label: 'Impacto de alimentos', color: 'fill-lime-500' },
];

const toothNumbers = {
  upperRightAdult: ['18', '17', '16', '15', '14', '13', '12', '11'],
  upperLeftAdult: ['21', '22', '23', '24', '25', '26', '27', '28'],
  lowerLeftAdult: ['31', '32', '33', '34', '35', '36', '37', '38'],
  lowerRightAdult: ['41', '42', '43', '44', '45', '46', '47', '48'],
  upperRightDeciduous: ['55', '54', '53', '52', '51'],
  upperLeftDeciduous: ['61', '62', '63', '64', '65'],
  lowerLeftDeciduous: ['71', '72', '73', '74', '75'],
  lowerRightDeciduous: ['81', '82', '83', '84', '85'],
};

const Tooth = ({ id, condition, onConditionChange }: { id: string; condition: Condition; onConditionChange: (id: string, condition: Condition) => void; }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const currentCondition = conditions.find(c => c.id === condition) || conditions[0];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex flex-col items-center group">
            <svg width="40" height="50" viewBox="0 0 40 50" className="cursor-pointer">
              <path d="M10 10 C 10 0, 30 0, 30 10 L 30 30 C 30 45, 25 45, 25 45 L 23 30 L 17 30 L 15 45 C 15 45, 10 45, 10 30 Z" className={cn('stroke-gray-400 stroke-1 group-hover:stroke-primary transition-all', currentCondition.color)} />
            </svg>
          <span className="text-xs font-semibold text-muted-foreground">{id}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Diente {id}</h4>
            <p className="text-sm text-muted-foreground">Selecciona la condición.</p>
          </div>
          <ScrollArea className="h-48">
            <RadioGroup defaultValue={condition} onValueChange={(value) => onConditionChange(id, value as Condition)} className="p-1">
              {conditions.map(c => (
                <div key={c.id} className="flex items-center space-x-2 py-1">
                  <RadioGroupItem value={c.id} id={`cond-${id}-${c.id}`} />
                  <Label htmlFor={`cond-${id}-${c.id}`} className="flex items-center gap-2 cursor-pointer font-normal">
                    {c.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </ScrollArea>
          <Button onClick={() => setIsOpen(false)} size="sm">Aplicar</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export function Odontogram() {
  const [toothState, setToothState] = React.useState<ToothState>(() => {
    const initialState: ToothState = {};
    const allTeeth = Object.values(toothNumbers).flat();
    allTeeth.forEach(num => {
      initialState[num] = 'healthy';
    });
    // Example initial states
    initialState['16'] = 'caries';
    initialState['26'] = 'restoration';
    initialState['46'] = 'missing';
    initialState['55'] = 'pain';


    return initialState;
  });

  const handleConditionChange = (id: string, condition: Condition) => {
    setToothState(prev => ({ ...prev, [id]: condition }));
  };

  const renderQuadrant = (quadrant: string[]) => {
    return (
        <div className="flex justify-center space-x-1">
        {quadrant.map(num => (
            <Tooth key={num} id={num} condition={toothState[num]} onConditionChange={handleConditionChange} />
        ))}
        </div>
    );
  };
  
  return (
    <div className="p-4 bg-card rounded-lg border w-full overflow-x-auto">
      <div className="flex flex-col gap-4 min-w-max">
        {/* Adult Teeth */}
        <div className="flex justify-between">
            {renderQuadrant(toothNumbers.upperRightAdult)}
            {renderQuadrant(toothNumbers.upperLeftAdult)}
        </div>
         <div className="flex justify-between">
            {renderQuadrant(toothNumbers.lowerRightAdult.slice().reverse())}
            {renderQuadrant(toothNumbers.lowerLeftAdult)}
        </div>

        <hr className="my-4 border-dashed" />

        {/* Deciduous Teeth */}
         <div className="flex justify-between">
            {renderQuadrant(toothNumbers.upperRightDeciduous)}
            {renderQuadrant(toothNumbers.upperLeftDeciduous)}
        </div>
         <div className="flex justify-between">
            {renderQuadrant(toothNumbers.lowerRightDeciduous.slice().reverse())}
            {renderQuadrant(toothNumbers.lowerLeftDeciduous)}
        </div>
      </div>
    </div>
  );
}
