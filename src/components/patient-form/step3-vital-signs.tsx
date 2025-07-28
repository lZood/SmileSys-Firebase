
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const Step3VitalSigns = ({ formData, setFormData }: { formData: any, setFormData: Function }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
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
                        <Label htmlFor="pulse">Pulso</Label>
                        <Input id="pulse" value={formData.pulse} onChange={handleChange} placeholder="75 bpm" />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="temperature">Temperatura</Label>
                        <Input id="temperature" value={formData.temperature} onChange={handleChange} placeholder="36.5°C" />
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
