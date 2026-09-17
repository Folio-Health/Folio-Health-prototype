# The write path: every clinical write goes through `/api/*`

Read this before adding any screen that creates or updates a FHIR resource.
It was settled by testing against the live Medplum project, not by preference.

## The fact

Every facility AccessPolicy scopes its resources with
`_compartment=%organization`. A resource is only in that compartment when it
carries `meta.account = Organization/<facility>`, and Medplum treats
`meta.account` as a **project-admin-only** field. So when a facility user
(front desk, nurse, doctor, lab scientist, pharmacist) creates a Patient,
Appointment, Encounter, Observation, Composition, ServiceRequest,
MedicationRequest, DiagnosticReport or MedicationDispense straight from the
browser, the record arrives with no compartment, matches no policy criteria,
and Medplum answers **403**.

Verified end to end with disposable front-desk accounts: direct `POST Patient`
→ 403, direct `PUT Appointment` → 403; service-stamped create → 201 and
readable/searchable by the facility user. `e2e/access.spec.ts` asserts it on
every run.

Direct browser writes succeed only for project admins — the platform
operator and the service account. Code exercised as the operator will look
fine and fail for every real member of staff. (A batch of modules built that
way in Aug–Sep 2026 was reverted for exactly this reason; see git history
around `e4f5853..4d01532` and the revert commits that follow `c1f1146`.)

## The rule

- **Reads** are direct FHIR searches under the user's own policy — facility-
  scoped, read-only. A role whose policy lacks a type gets a 403 the screen
  renders as "not available for your role", never a broken page.
- **Writes** go through a server route that:
  1. derives the caller's facility from their session
     (`facilityBindingsFromAuthMe`, off the compiled policy — never from the
     request body);
  2. checks their role, and that the target record is readable with the
     caller's **own** token (`assertVisible`) — i.e. it is at their facility;
  3. applies the workflow rule — state machine, immutability, required fields;
  4. performs the write with the service identity, stamping `meta.account`
     (`stampedCreate` / `stampedUpdate`).

The helpers live in `src/lib/medplum/clinical.ts`. Registration
(`/api/patients`), appointments (`/api/appointments`), visits
(`/api/encounters`), vitals (`/api/vitals`), notes / orders / prescriptions
(`/api/clinical`), results (`/api/results`) and dispensing (`/api/dispense`)
all follow it. The service account must be a project admin
(`scripts/mark-service-admin.mjs`); role policies are authored by
`scripts/author-clinical-policies.mjs` and `scripts/grant-appointment-read.mjs`.

## The clinical encounter module, in one paragraph

Check-in opens an Encounter → the nurse files vitals on the Triage board
(`/vitals`; LOINC-coded Observations; filing them moves the visit to
`triaged`) → the doctor clerks on `/consultation/<encounter>` in the standard
sequence (presenting complaints → HPC → ROS → PMH → drugs/allergies → family →
social → optional obstetric/paediatric → summary → provisional diagnosis →
differentials → examination → investigations → management plan), signs the
note (Composition `final`, immutable), orders lab/imaging and prescribes, then
closes the visit (refused until signed) → the lab/imaging unit results the
order on `/laboratory` / `/radiology` (Observations + DiagnosticReport; a
final report completes the order and is never edited) → the pharmacist
reviews medication history and allergies and dispenses on `/pharmacy`.
Working logic and sources: `docs/research/`. Tests: `npm run e2e`.
