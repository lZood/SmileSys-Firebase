
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const conditions = [
    { id: 'diabetes', label: 'Diabetes' },
    { id: 'cardiopathy', label: 'Cardiopatías' },
    { id: 'hypertension', label: 'Hipertensión' },
    { id: 'coagulationIssues', label: 'Problemas de coagulación' },
    { id: 'epilepsy', label: 'Epilepsia' },
    { id: 'hepatitis', label: 'Hepatitis' },
    { id: 'hiv', label: 'VIH' },
    { id: 'cancer', label: 'Cáncer' },
    { id: 'allergies', label: 'Alergias' },
];

export const Step2MedicalHistory = ({ formData, setFormData }: { formData: any, setFormData: Function }) => {
    
    const handleCheckboxChange = (conditionId: string, checked: boolean) => {
        setFormData({
            ...formData,
            medicalConditions: {
                ...formData.medicalConditions,
                [conditionId]: checked
            }
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    return (
        <div className="space-y-6">
            <div>
                <Label className="text-base font-semibold">Antecedentes Médicos</Label>
                <p className="text-sm text-muted-foreground">Marque las condiciones que apliquen al paciente.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {conditions.map(condition => (
                        <div key={condition.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={condition.id} 
                                checked={formData.medicalConditions[condition.id]}
                                onCheckedChange={(checked) => handleCheckboxChange(condition.id, !!checked)}
                            />
                            <Label htmlFor={condition.id} className="font-normal cursor-pointer">{condition.label}</Label>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="grid gap-2">
                    <Label htmlFor="pregnancyQuarter">Trimestre de Embarazo (si aplica)</Label>
                    <Input 
                        id="pregnancyQuarter" 
                        value={formData.pregnancyQuarter} 
                        onChange={handleChange} 
                        placeholder="Ej. 2do Trimestre" 
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="currentMedications">Medicamentos Actuales</Label>
                     <Textarea 
                        id="currentMedications" 
                        value={formData.currentMedications} 
                        onChange={handleChange}
                        placeholder="Listar medicamentos separados por coma..." 
                    />
                </div>
            </div>
        </div>
    );
};
