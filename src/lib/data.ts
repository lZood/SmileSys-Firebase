
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
