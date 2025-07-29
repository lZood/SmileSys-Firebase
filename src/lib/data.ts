
export type Patient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastVisit: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Archived';
};

export const patients: Patient[] = [
  { id: 'PAT001', name: 'John Doe', email: 'john.d@example.com', phone: '555-0101', lastVisit: '2023-10-15', status: 'Active' },
  { id: 'PAT002', name: 'Jane Smith', email: 'jane.s@example.com', phone: '555-0102', lastVisit: '2023-09-20', status: 'Active' },
  { id: 'PAT003', name: 'Robert Johnson', email: 'robert.j@example.com', phone: '555-0103', lastVisit: '2023-11-01', status: 'Active' },
  { id: 'PAT004', name: 'Emily Williams', email: 'emily.w@example.com', phone: '555-0104', lastVisit: '2022-05-30', status: 'Inactive' },
  { id: 'PAT005', name: 'Michael Brown', email: 'michael.b@example.com', phone: '555-0105', lastVisit: '2023-10-22', status: 'Active' },
  { id: 'PAT006', name: 'Graciela Lugo', email: 'graciela@example.com', phone: '555-0106', lastVisit: '2023-11-10', status: 'Pending' },
  { id: 'PAT007', name: 'Christian Reyes', email: 'christian@example.com', phone: '555-0107', lastVisit: '2023-11-12', status: 'Archived' },
  { id: 'PAT008', name: 'Monica Lopez Parra', email: 'monica@example.com', phone: '555-0108', lastVisit: '2023-11-15', status: 'Active' },
];

export type Appointment = {
  id: string;
  patientName: string;
  doctor: string;
  service: string;
  time: string;
  date: string; // YYYY-MM-DD
  status: 'Scheduled' | 'Completed' | 'Canceled' | 'In-progress';
};


const getRelativeDate = (dayOffset: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date;
}

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export const appointments: Appointment[] = [
    { id: 'APP001', patientName: 'Robert Johnson', doctor: 'Dr. Adams', service: 'Check-up', time: '09:00', date: formatDate(getRelativeDate(-1)), status: 'Completed' },
    { id: 'APP002', patientName: 'John Doe', doctor: 'Dr. Adams', service: 'Cleaning', time: '10:00', date: formatDate(getRelativeDate(0)), status: 'Scheduled' },
    { id: 'APP003', patientName: 'Michael Brown', doctor: 'Dr. Wilson', service: 'Extraction', time: '11:00', date: formatDate(getRelativeDate(0)), status: 'Scheduled' },
    { id: 'APP004', patientName: 'Sarah Miller', doctor: 'Dr. Adams', service: 'Filling', time: '14:00', date: formatDate(getRelativeDate(1)), status: 'Scheduled' },
    { id: 'APP005', patientName: 'David Garcia', doctor: 'Dr. Wilson', service: 'Check-up', time: '15:00', date: formatDate(getRelativeDate(7)), status: 'Scheduled' },
    { id: 'APP006', patientName: 'Emily Williams', doctor: 'Dr. Carter', service: 'Root Canal', time: '13:00', date: formatDate(getRelativeDate(-1)), status: 'Canceled' },
    { id: 'APP007', patientName: 'Jane Smith', doctor: 'Dr. Adams', service: 'Crown', time: '16:00', date: formatDate(getRelativeDate(0)), status: 'In-progress' },
    { id: 'APP008', patientName: 'Graciela Lugo', doctor: 'Dr. Adams', service: 'Check-up', time: '12:00', date: formatDate(getRelativeDate(0)), status: 'Scheduled' },
    { id: 'APP009', patientName: 'Christian Reyes', doctor: 'Dr. Carter', service: 'Whitening', time: '09:00', date: formatDate(getRelativeDate(2)), status: 'Scheduled' },
];

export const treatmentStatsData = [
    { name: 'Cleaning', value: 400 },
    { name: 'Extraction', value: 300 },
    { name: 'Filling', value: 300 },
    { name: 'Root Canal', value: 200 },
    { name: 'Crown', value: 278 },
    { name: 'Implants', value: 189 },
];

export type InventoryItem = {
    id: string;
    name: string;
    category: string;
    stock: number;
    minStock: number;
    price: number;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    provider: string;
    lastOrdered: string; // YYYY-MM-DD
};


export const inventoryItems: InventoryItem[] = [
    { id: 'INV001', name: 'Guantes de Nitrilo (Caja)', category: 'Consumibles', stock: 5, minStock: 10, price: 15.00, status: 'Low Stock', provider: 'DentalSupplies Co.', lastOrdered: '2023-10-15' },
    { id: 'INV002', name: 'Mascarillas Quirúrgicas (Caja)', category: 'Consumibles', stock: 20, minStock: 15, price: 12.50, status: 'In Stock', provider: 'MediSafe Inc.', lastOrdered: '2023-10-20' },
    { id: 'INV003', name: 'Anestésico Local (Botella)', category: 'Medicación', stock: 0, minStock: 5, price: 25.00, status: 'Out of Stock', provider: 'PharmaHeal', lastOrdered: '2023-09-30' },
    { id: 'INV004', name: 'Espejo Dental', category: 'Instrumental', stock: 50, minStock: 20, price: 5.75, status: 'In Stock', provider: 'Precision Tools', lastOrdered: '2023-08-01' },
    { id: 'INV005', name: 'Película de Rayos X (Paquete)', category: 'Imagenología', stock: 12, minStock: 10, price: 55.00, status: 'Low Stock', provider: 'RadiaTech', lastOrdered: '2023-10-05' },
    { id: 'INV006', name: 'Resina Compuesta (Jeringa)', category: 'Materiales Restauradores', stock: 30, minStock: 25, price: 45.00, status: 'In Stock', provider: 'BioFill', lastOrdered: '2023-11-01' },
];

export type Payment = {
    id: string;
    invoiceNumber: string;
    patientId: string;
    patientName: string;
    amount: number;
    date: string; // YYYY-MM-DD
    status: 'Paid' | 'Pending' | 'Canceled';
    method: 'Card' | 'Cash' | 'Transfer';
    concept: string;
};

export const payments: Payment[] = [
    { id: 'PAY001', invoiceNumber: 'INV-20231015-001', patientId: 'PAT001', patientName: 'John Doe', amount: 150, date: '2023-10-15', status: 'Paid', method: 'Card', concept: 'Limpieza y Revisión' },
    { id: 'PAY002', invoiceNumber: 'INV-20231020-002', patientId: 'PAT002', patientName: 'Jane Smith', amount: 250, date: '2023-10-20', status: 'Paid', method: 'Cash', concept: 'Blanqueamiento Dental' },
    { id: 'PAY003', invoiceNumber: 'INV-20231101-003', patientId: 'PAT003', patientName: 'Robert Johnson', amount: 800, date: '2023-11-01', status: 'Pending', method: 'Transfer', concept: 'Implante Dental' },
    { id: 'PAY004', invoiceNumber: 'INV-20231105-004', patientId: 'PAT005', patientName: 'Michael Brown', amount: 75, date: '2023-11-05', status: 'Paid', method: 'Card', concept: 'Radiografía Panorámica' },
    { id: 'PAY005', invoiceNumber: 'INV-20231110-005', patientId: 'PAT006', patientName: 'Graciela Lugo', amount: 320, date: '2023-11-10', status: 'Paid', method: 'Cash', concept: 'Tratamiento de Caries' },
    { id: 'PAY006', invoiceNumber: 'INV-20231112-006', patientId: 'PAT004', patientName: 'Emily Williams', amount: 500, date: '2023-11-12', status: 'Canceled', method: 'Card', concept: 'Ortodoncia - Pago Inicial' },
];

export type QuoteItem = { description: string; cost: number; };
export type Quote = {
    id: string;
    patientId: string;
    patientName: string;
    items: QuoteItem[];
    total: number;
    status: 'Draft' | 'Presented' | 'Accepted' | 'Expired';
    createdAt: string; // YYYY-MM-DD
    expiresAt: string; // YYYY-MM-DD
};

export const quotes: Quote[] = [
    {
        id: 'QUO001',
        patientId: 'PAT003',
        patientName: 'Robert Johnson',
        items: [
            { description: 'Implante Dental (Tornillo)', cost: 800 },
            { description: 'Corona de Porcelana', cost: 450 },
            { description: 'Cirugía de Colocación', cost: 200 },
        ],
        total: 1450,
        status: 'Presented',
        createdAt: '2023-10-28',
        expiresAt: '2023-11-28',
    },
    {
        id: 'QUO002',
        patientId: 'PAT007',
        patientName: 'Christian Reyes',
        items: [
            { description: 'Blanqueamiento Dental Zoom', cost: 250 },
            { description: 'Limpieza Profunda', cost: 120 },
        ],
        total: 370,
        status: 'Accepted',
        createdAt: '2023-11-05',
        expiresAt: '2023-12-05',
    },
    {
        id: 'QUO003',
        patientId: 'PAT002',
        patientName: 'Jane Smith',
        items: [
            { description: 'Set de Carillas (8 dientes)', cost: 3200 },
        ],
        total: 3200,
        status: 'Draft',
        createdAt: '2023-11-10',
        expiresAt: '2023-12-10',
    },
];
