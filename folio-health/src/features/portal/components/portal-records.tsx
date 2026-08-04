"use client"

import { format } from "date-fns"
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  DropletIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  SyringeIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { PORTAL_PATIENT, getPortalDoctor, PORTAL_IMMUNIZATIONS } from "@/lib/mock/portal"

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

function PortalRecords() {
  const doctor = getPortalDoctor()

  return (
    <div>
      <PageHeader title="Medical Records" description="Your medical history on file at Folio Health EMR" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <PersonAvatar name={PORTAL_PATIENT.name} seed={PORTAL_PATIENT.avatarSeed} size="lg" className="size-20" />
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">{PORTAL_PATIENT.name}</p>
              <p className="text-sm text-muted-foreground">
                {PORTAL_PATIENT.gender}, {PORTAL_PATIENT.age} Years &middot; {PORTAL_PATIENT.mrn}
              </p>
            </div>
            <StatusBadge status={PORTAL_PATIENT.status} />
            <div className="mt-2 flex w-full flex-col gap-3 text-left">
              <InfoRow icon={PhoneIcon} label="Phone" value={PORTAL_PATIENT.phone} />
              <InfoRow icon={MailIcon} label="Email" value={PORTAL_PATIENT.email} />
              <InfoRow icon={UserRoundIcon} label="Primary Doctor" value={doctor?.name ?? "Unassigned"} />
              <InfoRow
                icon={MapPinIcon}
                label="Address"
                value={`${PORTAL_PATIENT.address.city}, ${PORTAL_PATIENT.address.state}`}
              />
              <InfoRow icon={DropletIcon} label="Blood Group" value={PORTAL_PATIENT.bloodGroup} />
              <InfoRow icon={ShieldCheckIcon} label="Insurance" value={PORTAL_PATIENT.insurance.provider} />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Tabs defaultValue="history">
            <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
              {["History", "Allergies", "Conditions", "Immunizations", "Insurance"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab.toLowerCase()}
                  className="rounded-md border border-transparent bg-muted/60 px-3 py-1.5 data-active:border-border data-active:bg-background"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                  <CardDescription>Background information on file with your care team</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Date of Birth</span>
                    <span className="text-sm text-foreground">{format(new Date(PORTAL_PATIENT.dob), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Marital Status</span>
                    <span className="text-sm text-foreground">{PORTAL_PATIENT.maritalStatus}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Occupation</span>
                    <span className="text-sm text-foreground">{PORTAL_PATIENT.occupation}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Height / Weight</span>
                    <span className="text-sm text-foreground">
                      {PORTAL_PATIENT.height} cm &middot; {PORTAL_PATIENT.weight} kg
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:col-span-2">
                    <span className="text-xs text-muted-foreground">Emergency Contact</span>
                    <span className="text-sm text-foreground">
                      {PORTAL_PATIENT.emergencyContact.name} ({PORTAL_PATIENT.emergencyContact.relationship}) &middot;{" "}
                      {PORTAL_PATIENT.emergencyContact.phone}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="allergies" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Allergies</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {PORTAL_PATIENT.allergies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No known allergies on record.</p>
                  ) : (
                    PORTAL_PATIENT.allergies.map((allergy) => (
                      <div
                        key={allergy}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                      >
                        <span className="text-sm text-foreground">{allergy}</span>
                        <StatusBadge status="Confirmed" tone="red" />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conditions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chronic Conditions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {PORTAL_PATIENT.chronicConditions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active chronic conditions on record.</p>
                  ) : (
                    PORTAL_PATIENT.chronicConditions.map((condition) => (
                      <div
                        key={condition}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                      >
                        <span className="text-sm text-foreground">{condition}</span>
                        <StatusBadge status="Active" />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="immunizations" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Immunization History</CardTitle>
                  <CardDescription>Vaccines administered on record</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {PORTAL_IMMUNIZATIONS.map((imm) => (
                    <div
                      key={imm.vaccine}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <SyringeIcon className="size-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{imm.vaccine}</span>
                          <span className="text-xs text-muted-foreground">{imm.provider}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(imm.dateGiven), "MMM d, yyyy")}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insurance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Insurance Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Provider</span>
                    <span className="text-sm font-medium text-foreground">{PORTAL_PATIENT.insurance.provider}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Plan</span>
                    <span className="text-sm font-medium text-foreground">{PORTAL_PATIENT.insurance.plan}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Policy Number</span>
                    <span className="text-sm font-medium text-foreground">{PORTAL_PATIENT.insurance.policyNumber}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Valid Till</span>
                    <span className="text-sm font-medium text-foreground">
                      {format(new Date(PORTAL_PATIENT.insurance.validTill), "MMM d, yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export { PortalRecords }
