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
  
export type ToothState = { [key: string]: Condition };

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

const Tooth = ({ id, condition, onConditionChange, isReadOnly, size }: { id: string; condition: Condition; onConditionChange: (id: string, condition: Condition) => void; isReadOnly: boolean; size: { w: number; h: number } }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentCondition = conditions.find(c => c.id === condition) || conditions[0];
  const handleValueChange = (value: string) => {
    onConditionChange(id, value as Condition);
    setIsOpen(false);
  }
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild disabled={isReadOnly}>
        <button className="flex flex-col items-center group disabled:cursor-not-allowed" style={{width: size.w + 4}}>
            <svg width={size.w} height={size.h} viewBox="0 0 40 50" className="cursor-pointer">
              <path d="M10 10 C 10 0, 30 0, 30 10 L 30 30 C 30 45, 25 45, 25 45 L 23 30 L 17 30 L 15 45 C 15 45, 10 45, 10 30 Z" className={cn('stroke-gray-400 stroke-1 group-hover:stroke-primary transition-all', currentCondition.color)} />
            </svg>
          <span className="text-[10px] font-semibold text-muted-foreground leading-none mt-0.5">{id}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Diente {id}</h4>
            <p className="text-sm text-muted-foreground">Selecciona la condición.</p>
          </div>
          <ScrollArea className="h-48">
            <RadioGroup defaultValue={condition} onValueChange={handleValueChange} className="p-1">
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
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Props for Odontogram
type OdontogramProps = {
    initialData?: ToothState | null;
    onChange?: (newState: ToothState) => void;
    isReadOnly?: boolean;
    compact?: boolean; // nuevo modo compacto para móvil
};

// Function to create an empty (all healthy) chart state
const createDefaultChartState = (): ToothState => {
    const initialState: ToothState = {};
    const allTeeth = Object.values(toothNumbers).flat();
    allTeeth.forEach(num => {
        initialState[num] = 'healthy';
    });
    return initialState;
}

export function Odontogram({ initialData, onChange, isReadOnly = false, compact = false }: OdontogramProps) {
  const [toothState, setToothState] = React.useState<ToothState>(() => {
    return initialData && Object.keys(initialData).length > 0 ? initialData : createDefaultChartState();
  });

  React.useEffect(() => {
     // If parent component sends new initialData, update the state
     if (initialData && Object.keys(initialData).length > 0) {
        setToothState(initialData);
     }
  }, [initialData]);

  const handleConditionChange = (id: string, condition: Condition) => {
    if (isReadOnly) return;
    
    const newState = { ...toothState, [id]: condition };
    setToothState(newState);

    if (onChange) {
        onChange(newState);
    }
  };

  const toothSize = compact ? { w: 28, h: 36 } : { w: 40, h: 50 };
  const renderQuadrant = (quadrant: string[]) => {
    return (
        <div className="flex justify-center gap-1">
        {quadrant.map(num => (
            <Tooth key={num} id={num} condition={toothState[num] || 'healthy'} onConditionChange={handleConditionChange} isReadOnly={isReadOnly} size={toothSize} />
        ))}
        </div>
    );
  };
  
  return (
    <div className={cn('bg-card rounded-lg border w-full', compact ? 'p-2 overflow-x-auto' : 'p-4 overflow-x-auto')}>      
      <div className={cn('flex flex-col min-w-max', compact ? 'gap-2 scale-[0.95]' : 'gap-4')}>        
        <div className="flex justify-between">
            {renderQuadrant(toothNumbers.upperRightAdult)}
            {renderQuadrant(toothNumbers.upperLeftAdult)}
        </div>
         <div className="flex justify-between">
            {renderQuadrant(toothNumbers.lowerRightAdult.slice().reverse())}
            {renderQuadrant(toothNumbers.lowerLeftAdult)}
        </div>

        <hr className="my-2 border-dashed" />

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
