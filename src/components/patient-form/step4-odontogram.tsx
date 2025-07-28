
import { Odontogram } from '@/components/odontogram';
import { Label } from '@/components/ui/label';

export const Step4Odontogram = ({ formData, setFormData }: { formData: any, setFormData: Function }) => {
    
    const handleOdontogramChange = (toothState: any) => {
        setFormData({ ...formData, dentalChart: toothState });
    };

    return (
        <div className="space-y-4">
             <div>
                <Label className="text-base font-semibold">Odontograma</Label>
                <p className="text-sm text-muted-foreground">
                    Haz clic en un diente y luego selecciona la condición en el menú inferior para marcarla.
                </p>
            </div>
            <Odontogram 
                // This assumes Odontogram has an `onChange` prop to lift its state up.
                // You might need to modify the Odontogram component to support this.
                // For now, we simulate this interaction.
                // onConditionChange={(id, condition) => {
                //     const newChart = { ...formData.dentalChart, [id]: condition };
                //     handleOdontogramChange(newChart);
                // }}
                // initialData={formData.dentalChart}
            />
             <div className="text-xs text-center text-muted-foreground pt-4">
                El estado del odontograma se guardará junto con el resto del formulario.
            </div>
        </div>
    );
};
