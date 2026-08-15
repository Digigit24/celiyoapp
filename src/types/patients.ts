/**
 * Types for dghms's PatientProfile domain (/api/patients/*).
 * Mobile can create patients inline from New Visit / New Admission (matching
 * celiyohms's PatientIntakeStep) — full patient-management CRUD still stays
 * web-only.
 */

export type Gender = "male" | "female" | "other";
export type PatientStatus = "active" | "inactive" | "deceased";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export interface PatientListItem {
  id: number;
  patient_id: string;
  full_name: string;
  first_name: string;
  last_name: string | null;
  middle_name: string | null;
  date_of_birth: string | null;
  age: number | null;
  gender: Gender;
  mobile_primary: string;
  email: string | null;
  blood_group: BloodGroup | null;
  city: string | null;
  status: PatientStatus;
  registration_date: string;
  last_visit_date: string | null;
  total_visits: number;
  is_insurance_valid: boolean;
}

export interface PatientVitals {
  id: number;
  patient: number;
  recorded_by_user_id: string | null;
  temperature: string | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  blood_pressure: string | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
  blood_glucose: number | null;
  notes: string | null;
  recorded_at: string;
}

export interface PatientAllergy {
  id: number;
  patient: number;
  allergy_type: "drug" | "food" | "environmental" | "contact" | "other";
  allergen: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
  symptoms: string | null;
  treatment: string | null;
  is_active: boolean;
  allergy_type_display: string;
  severity_display: string;
  created_at: string;
  updated_at: string;
  recorded_by_user_id: string | null;
}

export interface PatientDetail extends PatientListItem {
  user_id: string | null;
  title: string;
  full_address: string;
  mobile_secondary: string | null;
  address_line1: string | null;
  address_line2: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  height: string | null;
  weight: string | null;
  bmi: string | null;
  marital_status: "single" | "married" | "divorced" | "widowed" | null;
  occupation: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  aadhaar_number: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  insurance_expiry_date: string | null;
  photo_data: string | null;
  guardian_first_name: string | null;
  guardian_middle_name: string | null;
  guardian_last_name: string | null;
  guardian_mobile: string | null;
  guardian_gender: string | null;
  guardian_relation: string | null;
  guardian_address: string | null;
  guardian_photo_data: string | null;
  vitals: PatientVitals[];
  allergies: PatientAllergy[];
}

/** POST /patients/profiles create payload — required fields per PatientRegistrationSerializer. */
export interface PatientCreatePayload {
  title?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: Gender;
  mobile_primary: string;
  blood_group?: BloodGroup;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  photo_data?: string;
}
