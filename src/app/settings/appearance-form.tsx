'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateTheme } from './actions';
import { useRouter } from 'next/navigation';

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const ColorPicker = ({ label, value, onChange }: ColorPickerProps) => {
  const [colorValue, setColorValue] = React.useState(value);

  // Convert HSL string "h s l" to a hex color for the color input
  const toHex = (hslString: string) => {
    if (!hslString) return '#000000';
    const [h, s, l] = hslString.split(' ').map(Number);
    if (isNaN(h) || isNaN(s) || isNaN(l)) return '#000000';

    const s_norm = s / 100;
    const l_norm = l / 100;
    const c = (1 - Math.abs(2 * l_norm - 1)) * s_norm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l_norm - c / 2;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) { [r, g, b] = [c, x, 0]; }
    else if (h >= 60 && h < 120) { [r, g, b] = [x, c, 0]; }
    else if (h >= 120 && h < 180) { [r, g, b] = [0, c, x]; }
    else if (h >= 180 && h < 240) { [r, g, b] = [0, x, c]; }
    else if (h >= 240 && h < 300) { [r, g, b] = [x, 0, c]; }
    else if (h >= 300 && h < 360) { [r, g, b] = [c, 0, x]; }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${[r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')}`;
  };

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={toHex(colorValue)}
          className="p-1 h-10 w-10"
          // This is a simplified conversion, real implementation would be more robust
          onChange={(e) => {
            const hex = e.target.value;
            // A simple conversion back to HSL string would be complex.
            // For now, let's keep it simple and just update the HSL string manually.
            // In a real app, use a color picker library.
          }}
        />
        <Input
          value={colorValue}
          onChange={(e) => {
            setColorValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="e.g. 210 40% 98%"
        />
      </div>
    </div>
  );
};

export function AppearanceForm({ clinic }: { clinic: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const [theme, setTheme] = React.useState(clinic?.theme || {
    light: {
      background: '210 29% 95%',
      primary: '207 82% 67%',
      accent: '36 100% 75%',
    },
    dark: {
      background: '222.2 47.4% 11.2%',
      primary: '207 82% 67%',
      accent: '36 100% 75%',
    },
  });

  const handleLightChange = (key: string, value: string) => {
    setTheme((prev: any) => ({ ...prev, light: { ...prev.light, [key]: value } }));
  };
  
  const handleDarkChange = (key: string, value: string) => {
    setTheme((prev: any) => ({ ...prev, dark: { ...prev.dark, [key]: value } }));
  };

  const handleSave = async () => {
    const { error } = await updateTheme(clinic.id, theme);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
    } else {
      toast({ title: 'Theme Updated!', description: 'Your new theme has been saved and applied.' });
      router.refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Appearance</CardTitle>
        <CardDescription>
          Adjust your clinic's brand colors. Values should be in HSL format (e.g., "210 40% 98%").
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Light Theme</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ColorPicker label="Background" value={theme.light.background} onChange={(v) => handleLightChange('background', v)} />
            <ColorPicker label="Primary" value={theme.light.primary} onChange={(v) => handleLightChange('primary', v)} />
            <ColorPicker label="Accent" value={theme.light.accent} onChange={(v) => handleLightChange('accent', v)} />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dark Theme</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ColorPicker label="Background" value={theme.dark.background} onChange={(v) => handleDarkChange('background', v)} />
            <ColorPicker label="Primary" value={theme.dark.primary} onChange={(v) => handleDarkChange('primary', v)} />
            <ColorPicker label="Accent" value={theme.dark.accent} onChange={(v) => handleDarkChange('accent', v)} />
          </div>
        </div>
        <Button onClick={handleSave}>Save Theme</Button>
      </CardContent>
    </Card>
  );
}
