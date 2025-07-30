
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Step1PersonalInfo = ({ formData, setFormData }: { formData: any, setFormData: Function }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSelectChange = (value: string) => {
        setFormData({ ...formData, gender: value });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
                <Label htmlFor="firstName">Nombre(s) <span className="text-red-500">*</span></Label>
                <Input id="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" required />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="lastName">Apellidos <span className="text-red-500">*</span></Label>
                <Input id="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="age">Edad <span className="text-red-500">*</span></Label>
                <Input id="age" type="number" value={formData.age} onChange={handleChange} placeholder="30" required />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="gender">Género</Label>
                 <Select onValueChange={handleSelectChange} defaultValue={formData.gender}>
                    <SelectTrigger id="gender">
                        <SelectValue placeholder="Seleccionar género" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Femenino</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="occupation">Ocupación</Label>
                <Input id="occupation" value={formData.occupation} onChange={handleChange} placeholder="Ingeniero de Software" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono <span className="text-red-500">*</span></Label>
                <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="555-123-4567" required />
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="address">Domicilio</Label>
                <Input id="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, Anytown" />
            </div>
             <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="john.doe@example.com" />
            </div>
        </div>
    );
};
