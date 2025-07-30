
'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from './ui/button';

type WelcomeTourProps = {
  isOpen: boolean;
  onClose: () => void;
};

const tourSteps = [
  {
    title: 'Bienvenido a SmileSys',
    description: 'Tu nueva plataforma para gestionar tu clínica dental de manera eficiente. Echa un vistazo a nuestras características clave.',
    image: 'https://placehold.co/600x400.png',
    hint: 'welcome office',
  },
  {
    title: 'Gestión Completa de Pacientes',
    description: 'Registra, busca y gestiona el historial clínico completo de tus pacientes, incluyendo odontogramas interactivos.',
    image: 'https://placehold.co/600x400.png',
    hint: 'patient file',
  },
  {
    title: 'Calendario y Citas Inteligentes',
    description: 'Organiza tu agenda con una vista de calendario clara. Agenda, reprograma y gestiona citas con facilidad.',
    image: 'https://placehold.co/600x400.png',
    hint: 'calendar schedule',
  },
  {
    title: 'Control de Inventario',
    description: 'Nunca te quedes sin materiales. Nuestro sistema te alerta cuando el stock está bajo para que puedas reordenar a tiempo.',
    image: 'https://placehold.co/600x400.png',
    hint: 'inventory supplies',
  },
  {
    title: 'Facturación y Reportes',
    description: 'Genera facturas, registra pagos y obtén reportes detallados sobre el rendimiento financiero de tu clínica.',
    image: 'https://placehold.co/600x400.png',
    hint: 'financial report',
  },
];

export const WelcomeTour = ({ isOpen, onClose }: WelcomeTourProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg p-0">
        <Carousel className="w-full h-full flex flex-col">
          <CarouselContent>
            {tourSteps.map((step, index) => (
              <CarouselItem key={index}>
                <div className="flex flex-col h-full">
                  <SheetHeader className="p-6 text-center">
                    <SheetTitle className="text-2xl font-bold font-headline">{step.title}</SheetTitle>
                    <SheetDescription>{step.description}</SheetDescription>
                  </SheetHeader>
                  <div className="px-6">
                     <Image
                      src={step.image}
                      alt={step.title}
                      width={600}
                      height={400}
                      data-ai-hint={step.hint}
                      className="w-full rounded-lg object-cover"
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
             <CarouselPrevious />
             <CarouselNext />
           </div>
        </Carousel>
        <SheetFooter className="p-6 border-t absolute bottom-0 w-full bg-background">
          <Button onClick={onClose} className="w-full">Comenzar a usar SmileSys</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
