import type { Metadata } from "next"
import { PatientRegistrationWizard } from "@/features/reception/components/patient-registration-wizard"

export const metadata: Metadata = { title: "Patient Registration" }

export default function RegisterPatientPage() {
  return <PatientRegistrationWizard />
}
