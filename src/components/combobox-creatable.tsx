
'use client';

import * as React from 'react';
import {Check, ChevronsUpDown, PlusCircle} from 'lucide-react';

import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';

interface CreatableComboboxProps {
  options: {label: string; value: string}[];
  value: string;
  onChange: (value: string) => void;
  onCreate: (value: string) => Promise<{ id: string, name: string } | null>;
  placeholder: string;
  emptyMessage: string;
  createText: string;
}

export function CreatableCombobox({
  options,
  value,
  onChange,
  onCreate,
  placeholder,
  emptyMessage,
  createText,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreate = async () => {
    if (!inputValue) return;
    setIsCreating(true);
    const newOption = await onCreate(inputValue);
    setIsCreating(false);

    if (newOption) {
      onChange(newOption.id);
      setOpen(false);
      setInputValue('');
    }
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );
  
  const showCreateOption = inputValue && !filteredOptions.some(o => o.label.toLowerCase() === inputValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder={placeholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>{!showCreateOption && emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                    setInputValue('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {showCreateOption && (
                <>
                <CommandSeparator />
                <CommandGroup>
                    <CommandItem
                        onSelect={handleCreate}
                        disabled={isCreating}
                        className="text-primary hover:!bg-primary/10 cursor-pointer"
                    >
                       <PlusCircle className="mr-2 h-4 w-4" />
                       {isCreating ? 'Creando...' : `${createText} "${inputValue}"`}
                    </CommandItem>
                </CommandGroup>
                </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
