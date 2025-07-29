
import { Wallet, CreditCard, Landmark } from 'lucide-react';

export const getPaymentMethodIcon = (method: 'Card' | 'Cash' | 'Transfer') => {
    switch (method) {
        case 'Card':
            return <CreditCard className="w-4 h-4 text-blue-500" />;
        case 'Cash':
            return <Wallet className="w-4 h-4 text-green-500" />;
        case 'Transfer':
            return <Landmark className="w-4 h-4 text-purple-500" />;
        default:
            return null;
    }
};
