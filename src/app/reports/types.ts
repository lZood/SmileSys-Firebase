export interface Payment {
    id: string;
    amount_paid: number;
    payment_date: string;
    treatment: {
        name: string;
    };
    payment_method: string;
    created_at: string;
}

export interface Quote {
    id: string;
    status: 'Draft' | 'Presented' | 'Accepted' | 'Rejected';
    total_amount: number;
    created_at: string;
}

export interface MonthlyRevenue {
    month: string;
    revenue: number;
}

export interface AppointmentsByDoctor {
    doctor: string;
    appointments: number;
}

export interface RevenueByTreatment {
    name: string;
    revenue: number;
}

export interface QuoteConversion {
    name: string;
    value: number;
}
