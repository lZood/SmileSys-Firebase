# **App Name**: SmileSys

## Core Features:

- User Authentication: User authentication for clinic staff, associating each user with a specific clinic and defining user roles (admin, doctor, staff) within each clinic.
- Patient Management (CRUD): Complete CRUD (Create, Read, Update, Delete) module for patient management, including creating new patients through a comprehensive form, viewing a list of all patients with search and filters, accessing a detailed view of each patient's clinical history, editing patient information, and securely deleting patients with confirmation.
- Appointment Scheduling: Module for appointment scheduling, enabling the scheduling of new appointments for existing patients, viewing a list of the day's and upcoming appointments, modifying the status of an appointment (scheduled, completed, canceled), and rescheduling appointments.
- Dashboard: Dashboard providing a general overview with key statistics such as total patients, appointments for the day, and inventory alerts, along with graphs of treatment statistics (cleanings, extractions, etc.) and a list of recent appointments.
- Calendar: Visual calendar displaying all scheduled appointments for the month, with a detailed view for each day upon clicking a date and navigation between months.
- Billing and Payments: Module for billing and payments, allowing the recording of patient payments (cash, card, transfer), viewing a payment history for each patient, and providing a summary of monthly income.
- Inventory Management: Inventory management module for adding and editing inventory items (materials, instruments, etc.), controlling stock levels with low stock and out-of-stock alerts, and searching and filtering by category and status.
- Interactive Odontogram: Interactive odontogram providing a graphical representation of the patient's dentition, with the ability to mark specific conditions on each tooth (caries, restoration, absent, etc.).
- Digital Informed Consents: Digital informed consent feature for generating consent forms (e.g., orthodontics) with treatment details and costs, capturing digital signatures from the patient and doctor directly in the application, and generating and storing a PDF of the signed consent in the cloud (Firebase Storage).
- Google Calendar Integration: Integration with Google Calendar, allowing doctors to connect their Google account to synchronize appointments from SmileSys with their personal calendar and automatically create events in Google Calendar when scheduling an appointment.
- Profile and Configuration Management: Profile and settings management page for managing user profiles and integrations, along with managing clinic information and members (for the 'admin' role).
- Notifications: Notifications for sending automatic appointment reminders via email or SMS to patients and internal notifications for clinic staff.

## Style Guidelines:

- Soft blue (#64B5F6) for a calm and professional feel.
- Light gray (#F0F4F8) for a clean and modern look.
- Light orange (#FFCC80) to highlight key actions and information.
- 'PT Sans' (sans-serif) for readability and a modern feel.
- Use 'lucide-react' library for simple and clear icons.
- Clean, responsive design optimized for desktop and tablet use.
- Subtle transitions and animations for a smooth user experience.