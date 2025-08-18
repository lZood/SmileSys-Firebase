import { Odontogram, ToothState } from '@/components/odontogram';
import { Label } from '@/components/ui/label';
import * as React from 'react';

export const Step4Odontogram = ({ formData, setFormData, compact }: { formData: any, setFormData: Function, compact?: boolean }) => {
    
    const handleOdontogramChange = (toothState: ToothState) => {
        setFormData({ ...formData, dentalChart: toothState });
    };

    return (
        <div className="space-y-4">
             <div>
                <Label className="text-base font-semibold">Odontograma</Label>
                <p className="text-sm text-muted-foreground">
                    Haz clic en un diente para seleccionar su condición. El estado inicial es "Sano" para todos los dientes.
                </p>
            </div>
            <Odontogram 
                onChange={handleOdontogramChange}
                initialData={formData.dentalChart}
                compact={compact}
            />
             <div className="text-xs text-center text-muted-foreground pt-4">
                El estado del odontograma se guardará junto con el resto del formulario.
            </div>
        </div>
    );
};
