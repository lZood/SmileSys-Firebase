
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const Step3VitalSigns = ({ formData, setFormData }: { formData: any, setFormData: Function }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        if (id === 'pulse' || id === 'temperature') {
            // Allow only numbers and a decimal point for temperature
            const numericValue = value.replace(/[^0-9.]/g, '');
            // Prevent multiple decimal points
            if (numericValue.split('.').length > 2 && id === 'temperature') return;

            setFormData({ ...formData, [id]: numericValue });
            return;
        }
        setFormData({ ...formData, [id]: value });
    };

    return (
        <div className="space-y-6">
             <div>
                <Label className="text-base font-semibold">Signos Vitales</Label>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                     <div className="grid gap-2">
                        <Label htmlFor="bloodPressure">Presión Arterial</Label>
                        <Input id="bloodPressure" value={formData.bloodPressure} onChange={handleChange} placeholder="120/80" />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="pulse">Pulso (bpm)</Label>
                        <Input id="pulse" type="text" value={formData.pulse} onChange={handleChange} placeholder="75" />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="temperature">Temperatura (°C)</Label>
                        <Input id="temperature" type="text" value={formData.temperature} onChange={handleChange} placeholder="36.5" />
                    </div>
                 </div>
            </div>
             <div>
                <Label className="text-base font-semibold">Diagnóstico</Label>
                 <div className="grid gap-2 mt-2">
                    <Label htmlFor="medicalDiagnosis">Diagnóstico Médico <span className="text-red-500">*</span></Label>
                     <Textarea 
                        id="medicalDiagnosis" 
                        value={formData.medicalDiagnosis} 
                        onChange={handleChange}
                        placeholder="Descripción del diagnóstico inicial..."
                        className="min-h-[120px]"
                    />
                </div>
            </div>

        </div>
    );
};
