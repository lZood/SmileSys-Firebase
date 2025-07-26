
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
  date: string;
  status: 'Scheduled' | 'Completed' | 'Canceled' | 'In-progress';
};

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);


const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


export const appointments: Appointment[] = [
    { id: 'APP001', patientName: 'Robert Johnson', doctor: 'Dr. Adams', service: 'Check-up', time: '09:00 AM', date: formatDate(yesterday), status: 'Completed' },
    { id: 'APP002', patientName: 'John Doe', doctor: 'Dr. Adams', service: 'Cleaning', time: '10:00 AM', date: formatDate(today), status: 'Scheduled' },
    { id: 'APP003', patientName: 'Michael Brown', doctor: 'Dr. Wilson', service: 'Extraction', time: '11:00 AM', date: formatDate(today), status: 'Scheduled' },
    { id: 'APP004', patientName: 'Sarah Miller', doctor: 'Dr. Adams', service: 'Filling', time: '02:00 PM', date: formatDate(tomorrow), status: 'Scheduled' },
    { id: 'APP005', patientName: 'David Garcia', doctor: 'Dr. Wilson', service: 'Check-up', time: '03:00 PM', date: formatDate(nextWeek), status: 'Scheduled' },
    { id: 'APP006', patientName: 'Emily Williams', doctor: 'Dr. Carter', service: 'Root Canal', time: '01:00 PM', date: formatDate(yesterday), status: 'Canceled' },
    { id: 'APP007', patientName: 'Jane Smith', doctor: 'Dr. Adams', service: 'Crown', time: '04:00 PM', date: formatDate(today), status: 'In-progress' },
];

export const treatmentStatsData = [
    { name: 'Cleaning', value: 400 },
    { name: 'Extraction', value: 300 },
    { name: 'Filling', value: 300 },
    { name: 'Root Canal', value: 200 },
    { name: 'Crown', value: 278 },
    { name: 'Implants', value: 189 },
];

export const inventoryItems = [
    { id: 'INV001', name: 'Dental Gloves', category: 'Consumables', stock: 5, status: 'Low Stock' },
    { id: 'INV002', name: 'Surgical Masks', category: 'Consumables', stock: 20, status: 'In Stock' },
    { id: 'INV003', name: 'Anesthetic', category: 'Medication', stock: 0, status: 'Out of Stock' },
    { id: 'INV004', name: 'Dental Mirror', category: 'Instruments', stock: 50, status: 'In Stock' },
    { id: 'INV005', name: 'X-Ray Film', category: 'Imaging', stock: 12, status: 'In Stock' },
];
