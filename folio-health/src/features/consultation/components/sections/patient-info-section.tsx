import {
  CakeIcon,
  DropletIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UserRoundIcon,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/common/status-badge"
import { format } from "date-fns"
import type { Patient, StaffMember } from "@/types/core"

function InfoRow({ icon: Icon, label, value }: { icon: typeof PhoneIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm text-foreground">{value}</span>
      </div>
    </div>
  )
}

function PatientInfoSection({ patient, doctor }: { patient: Patient; doctor?: StaffMember }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Demographics & Contact</CardTitle>
          <CardDescription>Read-only summary from the patient record</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow icon={UserRoundIcon} label="Full Name" value={patient.name} />
          <InfoRow icon={CakeIcon} label="Date of Birth" value={format(new Date(patient.dob), "MMM d, yyyy")} />
          <InfoRow icon={PhoneIcon} label="Phone" value={patient.phone} />
          <InfoRow icon={MailIcon} label="Email" value={patient.email} />
          <InfoRow
            icon={MapPinIcon}
            label="Address"
            value={`${patient.address.city}, ${patient.address.state}`}
          />
          <InfoRow icon={DropletIcon} label="Blood Group" value={patient.bloodGroup} />
          <InfoRow icon={UserRoundIcon} label="Primary Doctor" value={doctor?.name ?? "Unassigned"} />
          <InfoRow icon={ShieldCheckIcon} label="Insurance" value={patient.insurance.provider} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Allergies</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {patient.allergies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No known allergies.</p>
            ) : (
              patient.allergies.map((allergy) => (
                <div key={allergy} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-foreground">
                    <TriangleAlertIcon className="size-3.5 text-red-600 dark:text-red-400" />
                    {allergy}
                  </span>
                  <StatusBadge status="Confirmed" tone="red" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chronic Conditions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {patient.chronicConditions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active diagnoses on record.</p>
            ) : (
              patient.chronicConditions.map((condition) => (
                <div key={condition} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{condition}</span>
                  <StatusBadge status="Active" tone="blue" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InfoRow icon={UserRoundIcon} label="Name" value={patient.emergencyContact.name} />
          <InfoRow icon={UserRoundIcon} label="Relationship" value={patient.emergencyContact.relationship} />
          <InfoRow icon={PhoneIcon} label="Phone" value={patient.emergencyContact.phone} />
        </CardContent>
      </Card>
    </div>
  )
}

export { PatientInfoSection }
