# Back-Office & Security/System Workflows in Production EMRs — Design Reference

Research synthesis covering Epic, Oracle Health (Cerner), athenahealth, MEDITECH, and Medplum, with canonical state machines, actors, compliance logic, and FHIR mappings.

---

## 1. Revenue Cycle / Billing

### Actors
- **Registrar / front desk** — captures demographics, insurance, runs eligibility (270/271), collects copays upfront.
- **Clinician** — generates charges implicitly by documenting/signing orders, procedures, and E&M levels during the encounter.
- **Charge router / charge review analyst** — works charge review work queues (missing modifiers, unpriced charges).
- **Coders (HIM)** — **facility coders** (hospital: ICD-10-CM/PCS, DRG) and **professional coders** (physician: CPT/HCPCS + ICD-10-CM). CDI specialists query physicians for documentation gaps before final coding.
- **Biller / claims analyst** — works claim edit queues, submits 837s.
- **AR follow-up / denials specialist** — works denial queues, files appeals.
- **Payment poster** — posts 835 remittances and patient payments.

### Workflow / lifecycle
**Epic model (Resolute HB/PB):** eligibility verification → clinical documentation → charge capture → coding → claim scrubbing → submission → payment posting → denial follow-up, with **work queues** routing tasks. Charges flow directly from the signed clinical chart into billing.

**Canonical claim state machine:**

```
Encounter closed → CHARGES CAPTURED → [charge review WQ: hold/edit]
→ CODING (facility acct sits in DNFB until coded)
→ CLAIM DRAFT → SCRUBBER EDITS (pass/fail; fail → claim edit WQ, loop)
→ SUBMITTED (837P/837I via clearinghouse)
→ 999 ack (syntax) → 277CA (accepted/REJECTED — rejected never adjudicated: fix & resubmit)
→ ADJUDICATION at payer (query via 276/277)
→ 835 ERA: PAID | PARTIALLY PAID | DENIED (CARC/RARC codes)
→ DENIED → denial WQ by denial category → CORRECTED CLAIM (resubmit) or APPEAL
→ appeal upheld/overturned → residual balance → PATIENT RESPONSIBILITY
→ statement cycle → payment plan → collections → write-off/charity
```

Key distinction: **rejection** (never entered adjudication — nothing to appeal, correct and resubmit) vs **denial** (adjudicated and refused — appealable, with CARC reason codes). 835s typically arrive 7–21 days post-submission. Epic's denial module auto-classifies denials by CARC/RARC and routes to work queues organized by denial type.

**athenahealth model:** athenaCollector scrubs every claim against a network-wide rules engine (~29,000+ payer rules) *before* submission; claims failing rules drop into **HOLD buckets** for staff review, giving ~98% first-pass acceptance. Design takeaway: a pre-submission rules engine with named hold states is the athena signature pattern.

**Coding workflow & DNFB:** Inpatient accounts post-discharge sit in **DNFB (Discharged Not Final Billed)** until coding completes; DNFB days are a core KPI. Clinicians never final-code facility claims.

**Self-pay vs insurance:** self-pay skips the payer loop entirely — no claim, no EOB; account goes charges → patient statement. Production systems run **propensity-to-pay** scoring to route patients to point-of-service collection, payment plans, or charity-care screening.

### Rules & compliance logic
- Eligibility verified before/at service (270/271 or FHIR `CoverageEligibilityRequest`).
- Claims must pass payer-specific edits before release; failed edits loop to work queues, never auto-submit.
- Timely-filing deadlines per payer (the state machine needs a deadline clock per claim).
- Only signed documentation is codeable; code changes after claim submission require corrected-claim logic, not silent edits.
- Payment posting must reconcile 835 totals to bank deposits.

### FHIR mapping
- **`Coverage`** — insurance plan/subscriber. **`CoverageEligibilityRequest/Response`** — 270/271 equivalent.
- **`ChargeItem`** — one billable service event; claim lines derive from ChargeItems; pricing rules in **`ChargeItemDefinition`**.
- **`Account`** — the bucket ChargeItems link to; guarantor container.
- **`Claim`** (status: draft | active | cancelled | entered-in-error; use: claim/preauthorization/predetermination) — the 837 equivalent.
- **`ClaimResponse`** — payer adjudication (outcome: queued/complete/error/partial); adjudication ≠ payment.
- **`Invoice`** — patient-facing bill (draft → issued → balanced → cancelled) — the self-pay path.
- **`PaymentNotice`/`PaymentReconciliation`** — correlates a bulk payment (835) to individual ClaimResponses/Invoices.
- Medplum implements this module and recommends Bot/Subscription-driven sync to clearinghouses.

### Sources
[Surety Systems – Epic charge capture](https://www.suretysystems.com/insights/using-epic-charge-capture-to-improve-revenue-integrity/) · [Saga IT – EDI 837](https://saga-it.com/blog/healthcare-edi-837-claims) / [EDI 835](https://saga-it.com/blog/healthcare-edi-835-remittance) · [HL7 ChargeItem](https://www.hl7.org/fhir/R4/chargeitem.html) · [HL7 PaymentReconciliation](https://www.hl7.org/fhir/R4/paymentreconciliation.html) · [Medplum billing docs](https://www.medplum.com/docs/billing) · [XY.AI – DNFB](https://www.xy.ai/glossary/discharged-not-final-billed-dnfb)

---

## 2. HIM / Medical Records

### Actors
- **Patient** — may *request* amendment; never edits the record directly.
- **HIM department** — owns amendment intake, merge/unmerge, ROI, retention.
- **Registration staff** — may correct **demographics** per their role; demographic edits are low-privilege but audited.
- **Authoring clinician** — the only person who corrects **clinical content** they authored (addendum/late entry/correction).
- **Privacy officer** — adjudicates contested amendments, ROI edge cases.
- **EMPI/identity team** — patient matching, merges.

### Workflow / lifecycle

**A. Clinical correction (clinician-initiated):** signed note → author opens **addendum** or marks **entered-in-error** → original version retained in history → correction signed → audit trail. Never physical deletion.

**B. Patient amendment request (HIPAA §164.526):**

```
RECEIVED (written request + reason)
→ UNDER REVIEW (HIM routes to record author/provider)
→ decision within 60 days (+ one 30-day extension with written notice)
→ ACCEPTED: make/link the amendment, tell the patient, notify prior recipients
→ DENIED (only if: not created here, not in designated record set, not
  available for access, or record is accurate & complete):
  written denial + patient may file a STATEMENT OF DISAGREEMENT
  → entity may add rebuttal → disagreement + rebuttal travel with all
  future disclosures of the disputed item
```

The amendment *appends*, it never overwrites; no fee may be charged.

**C. Duplicate merge / EMPI:**

```
candidate pair detected (deterministic + probabilistic scoring)
→ auto-link (high confidence) | HUMAN REVIEW QUEUE (ambiguous) | reject
→ HIM analyst verifies (never auto-merge ambiguous — overlay risk)
→ MERGE: choose surviving MRN; survivorship rules build the golden record;
  preserve all identifiers/history and provenance
→ publish merge event downstream; track acknowledgement
→ UNMERGE remains possible via preserved lineage
```

**D. Release of Information (ROI):**

```
REQUEST RECEIVED (patient, attorney, payer, subpoena…)
→ VALIDATE authority (right-of-access vs third-party authorization)
→ SCOPE: minimum necessary; screen super-protected classes (42 CFR Part 2
  SUD, psychotherapy notes, HIV/genetics per state law)
→ RETRIEVE + QC → DELIVER via secure channel
→ LOG in ACCOUNTING OF DISCLOSURES (6-year accounting available to patient)
```

Right-of-access clock: 30 days (+30 extension).

### Rules & compliance logic
- **Demographics vs clinical split:** registration roles edit demographics; clinical content only via author addendum or HIM-mediated amendment. Everything versioned and audited.
- **Retention:** HIPAA sets 6 years for *compliance documentation*; **medical-record retention is state law** (commonly 5–10 years, longer for minors).

### FHIR mapping
- Corrections = **resource versioning** (`_history`) + `status: entered-in-error`.
- **`Provenance`** — asserted at write time (who, why, prior versions, signatures); targets the new version of an amendment.
- **`AuditEvent`** — recorded by the server as events occur (reads included); Provenance = record-keeping assertion, AuditEvent = security log.
- Merge: **`Patient.link`** (`replaced-by`/`replaces`) + `Patient.active=false`; R5 `$merge` operation.
- ROI: `Consent`, `DocumentReference`/`Bundle`, `AuditEvent` with `purposeOfUse`.

### Sources
[AccountableHQ – §164.526](https://www.accountablehq.com/post/45-cfr-164-526-explained-hipaa-s-right-to-amend-your-medical-records) · [HHS – correction guidance](https://www.hhs.gov/sites/default/files/ocr/privacy/hipaa/understanding/special/healthit/correction.pdf) · [Medplum – EMPI](https://www.medplum.com/blog/empi-implementation) · [AHIMA – ROI toolkit](https://www.ahima.org/media/tf0ao3v1/release-of-information-toolkit_axs.pdf) · [HIPAA Journal – retention](https://www.hipaajournal.com/hipaa-retention-requirements/) · [HL7 Provenance](https://www.hl7.org/fhir/provenance.html) · [HL7 AuditEvent](https://hl7.org/fhir/auditevent.html)

---

## 3. Security & Access Control

### Actors
End users (clinical/admin roles) · security analysts · privacy/compliance office (audit review) · CISO/IT security · patients (flagged/confidential charts).

### Workflow / lifecycle

**Role templates.** Epic: users are assigned **security classes** wrapped in **user templates** per job role — change the template, all linked users update. Cerner uses position-based security. Medplum: **`AccessPolicy`** resources restrict read/write per resource-type and per-field, attached via `ProjectMembership`; parameterized policies let one template serve many users.

**Break-the-glass (BTG) state machine (Epic pattern):**

```
chart flagged (VIP / employee / behavioral health / restriction)
  OR user outside defined care team
→ WARNING SCREEN: user must select/enter access reason (+ often re-enter password)
→ decline → no access, event still may be logged
→ proceed → TIME-LIMITED elevated access granted
→ AUDIT RECORD (user, time, patient, reason, actions taken)
→ compliance office auto-notified
→ COMPLIANCE REVIEW: warranted (close) | unwarranted → sanctions workflow
```

Medplum's version: explicit reason required, scope to smallest useful set, short-lived session or temporary ProjectMembership, review AuditEvents after the window closes — maps to ONC §170.315(d)(6) Emergency Access.

**Session management / shared workstations:**
- HIPAA §164.312(a)(2)(iii): "terminate an electronic session after a predetermined time of inactivity." Risk-based — common practice **1–3 min in clinical areas, 10–15 min administrative**, re-auth on resume.
- **Tap-in/tap-out (Imprivata):** badge tap → workstation unlocks with the EMR already in context; tap-out → "Secure" (screen lock preserving patient context); **Fast User Switching** hands the workstation between staff; badge tap satisfies MFA for signing workflows.
- **Patient-context safety:** persistent patient banner (name, DOB, MRN, photo, allergies) on every screen; limits on concurrently open charts; wrong-chart alerts on rapid user switching.

### Rules & compliance logic
- **Minimum necessary (§164.502(b)):** written role-based access matrix; must justify every element. Exceptions: treatment disclosures, patient's own access, authorized disclosures.
- **Audit controls (§164.312(b), required):** log logon/logoff (success+failure), every PHI view/create/update/delete/print/export, BTG events, config changes; logs immutable, regularly reviewed, retained ≥6 years.
- Unique user identification (required) — no shared accounts.
- Sensitive-category overlays (psych, SUD/42 CFR Part 2, adolescent, VIP) sit *on top of* RBAC and trigger BTG.

### FHIR mapping
- **`AccessPolicy`** (Medplum), FHIR `Consent` for patient-directed restrictions, security labels (`meta.security`) for sensitive segments.
- **`AuditEvent`** — the canonical log record (agent, source, entity, `purposeOfUse`; BTG conveyed via purposeOfUse `BTG`/`ETREAT`).
- ONC §170.315(d)(6) emergency access is the certification hook for BTG.

### Sources
[CMU – Epic BTG](https://www.cmich.edu/docs/default-source/presidents-division/general-counsel/hipaa/hipaa-guidance-btg.pdf?sfvrsn=f1820735_4) · [UIowa – break glass](https://epicsupport.sites.uiowa.edu/epic-resources/break-glass) · [Yale – break glass procedure](https://hipaa.yale.edu/security/break-glass-procedure-granting-emergency-access-critical-ephi-systems) · [AccountableHQ – §164.312 logoff](https://www.accountablehq.com/post/hipaa-automatic-logoff-requirements-explained-45-cfr-164-312-a-2-iii) · [Imprivata – Epic architectures](https://docs.imprivata.com/supported/content/pdfs/digitalidentityref_epic.pdf) · [HHS – minimum necessary](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/minimum-necessary-requirement/index.html) · [Kiteworks – audit logs](https://www.kiteworks.com/hipaa-compliance/hipaa-audit-log-requirements/) · [Medplum – access policies](https://www.medplum.com/docs/access/access-policies)

---

## 4. User / Account Lifecycle

### Actors
HR (source of truth for joiners/movers/leavers) · hiring manager · application/security analyst · data owner/compliance · IAM/IGA platform.

### Workflow / lifecycle

```
JOINER: HR record created → access request with ROLE from approved catalog
→ manager + data-owner approval (auditable, no ad-hoc grants)
→ account provisioned from role template on day one
→ TEMPORARY PASSWORD issued → forced change at first login → MFA enrollment
→ training/attestation gate before go-live access

MOVER: job-code change → automatic re-evaluation → old entitlements removed,
new template applied (prevents privilege accumulation)

PERIODIC REVIEW: monthly for privileged/critical EHR roles, quarterly for
sensitive apps; manager attests each entitlement → revoke stale access

LEAVER: HR termination event → SAME-DAY deprovision across EHR, VPN, email,
badge → account disabled (not deleted, to preserve audit attribution)
→ periodic orphan-account sweep
```

### Rules & compliance logic
- HIPAA §164.308(a)(3) Workforce Security — authorization/supervision, clearance, **termination procedures**; §164.308(a)(4) requires documented access authorization.
- Prompt credential removal for departing staff, contractors, affiliates, volunteers.
- All grants/changes flow through auditable workflows; evidence retained.
- Temporary/first-login passwords must be single-use with forced reset.

### FHIR mapping
Medplum: `User` (login identity) → `ProjectMembership` (project + AccessPolicy binding) → profile resource (`Practitioner`); invite flow generates temporary credentials; `PractitionerRole` carries org/role/specialty; provisioning events logged as `AuditEvent`.

### Sources
[Oracle – EHR access governance](https://blogs.oracle.com/cloud-infrastructure/oracle-health-ehr-access-governance) · [ComplyDome – workforce security](https://www.complydome.com/compliance-resources/the-workforce-security-standard-a-guide-to-authorization-and-clearance-procedures-45-cfr-164308a3) · [Medplum – user management](https://www.medplum.com/docs/user-management)

---

## 5. Inventory / Pharmacy Stock & Supply Chain

### Actors
Pharmacy buyer/technician (POs, restock) · pharmacist (verification, recalls, formulary) · pharmacy manager (par levels) · automated dispensing cabinets (Pyxis/Omnicell) as system actors · materials management.

### Workflow / lifecycle
- **Epic Willow** inventory: multi-facility perpetual inventory decremented on dispense, returns and waste tracking, stock transfers, **purchase-order generation**, supplier interfaces (EDI 832/850/855/810).
- **Canonical stock state machine per item/location:**

```
stocked → decrement on dispense/administration → quantity ≤ REORDER POINT
→ reorder line auto-generated → PO draft → approved → sent to wholesaler
→ acknowledged → received (invoice matched to PO) → restocked to PAR LEVEL
Parallel: lot/expiration tracked per stock line → nearing-expiry report
→ pull/return-for-credit → expired → quarantine → destruction
Recall: lot lookup → affected stock + affected patients (via lot-level records)
```

- **ADC loop (Pyxis/Omnicell):** cabinets hold par-defined stock; every vend/return updates perpetual counts; cabinet generates restock lists; blind counts for controlled substances with discrepancy resolution.

### Rules & compliance logic
- Controlled substances: DEA Schedule II perpetual count + witness/discrepancy workflows; diversion monitoring analytics.
- FEFO (first-expired-first-out) picking; expired stock must not be dispensable (hard stop).
- Lot/expiry capture at receiving enables recall-to-patient traceability.

### FHIR mapping
Weakest FHIR area; the working set: **`Medication`** (+ `batch.lotNumber`/`expirationDate`), **`MedicationDispense`** (decrement event), **`SupplyRequest`** (internal restock), **`SupplyDelivery`** (fulfillment), **`InventoryItem`/`InventoryReport`** (R5+), `Location` for storage sites, `ChargeItem` when dispense is billable. Purchase orders to wholesalers remain EDI territory.

### Sources
[Connect Care – Willow](https://ehealth.connect-care.ca/epic-systems/epic-modules/willow) · [open.epic – pharmacy interfaces](https://open.epic.com/Ancillary/Pharmacy)

---

## 6. Communication: Secure Messaging & Results Routing

### Actors
Ordering provider (owns result acknowledgement) · covering provider/pool (delegation) · nurses/MAs (triage pools) · patients (portal messages) · system (auto-generated messages).

### Workflow / lifecycle
**Epic In Basket:** messaging inside the EHR; messages target individuals or **pools**; some message types auto-generate on events — result finalized, order needing cosignature, chart CC. Lab/imaging finalization automatically generates a Results message to the **ordering provider**. Coverage delegation, pool-based triage, escalation/overdue tracking.

**Cerner Message Center:** folders (Results, Documents, Orders, Reminders). **Endorsement** = acknowledgement; **OK & Next** confirms and advances — only then does the item clear; **Save does NOT acknowledge**.

**Canonical result-acknowledgement state machine:**

```
result FINALIZED by lab/rad system
→ routed to ordering provider's inbox (+ CC recipients, pools)
  [critical value: parallel synchronous call/read-back per CLIA/Joint
   Commission — inbox alone is insufficient for criticals]
→ NEW/UNREAD → VIEWED (not yet acknowledged — distinct state)
→ actions: result note / forward / reply / portal release
→ ACKNOWLEDGED (endorse/"Done") → removed from pending; ack audited
→ not acked within SLA → overdue escalation (covering provider / supervisor)
Coverage: provider out-of-office → auto-delegate inbox
```

Design invariants: every result must have exactly one accountable owner at all times; viewing ≠ acknowledging; acknowledgement is per-provider and audited; unacknowledged-results reports are a patient-safety control.

### Rules & compliance logic
- Secure messaging must stay in-system (no PHI to personal email/SMS), all reads/sends audited.
- Critical results: documented notification with read-back within defined timeframes (NPSG.02.03.01).
- Cosignature: orders/notes by residents, verbal orders route via the same inbox machinery.

### FHIR mapping
- **`Communication`** / **`CommunicationRequest`** — sent/planned messages.
- **`DiagnosticReport.status`** drives routing triggers; result ack modeled as a `Communication` or a `Task` (`requested` → `completed`) assigned to the ordering `Practitioner`, with `AuditEvent` for the ack.
- **`Task`** is the right resource for inbox items generally (cosign requests, overdue escalation via `restriction.period`).

### Sources
[Mindbowser – Epic In Basket](https://www.mindbowser.com/epic-in-basket-guide/) · [CST Cerner – results inbox](https://cstcernerhelp.healthcarebc.ca/Applications/Message_Centre/Manage_Results_in_Clinic_Inbox.htm) · [CST Cerner – abnormal/critical](https://cstcernerhelp.healthcarebc.ca/Applications/Message_Centre/Manage_Abnormal_and_Critical_Results_in_Message_Centre.htm)

---

## Cross-cutting design principles (for the prototype)

1. **Nothing is ever deleted** — every state machine ends in disabled/voided/entered-in-error/superseded, never row deletion; audit attribution depends on it.
2. **Work queues are the universal back-office primitive** (Epic WQs, athena hold buckets, denial queues, merge review queues, amendment queues): items enter on rule failure or event, are owned by a role, and exit only via an explicit disposition.
3. **Templates over per-user grants** — role/security templates + exception overlays (BTG) + per-patient restrictions, each layer independently audited.
4. **Viewing, saving, and acknowledging are three different states** in every review workflow (results, denials, amendments).
5. **Every privileged exception generates a review obligation** — BTG → compliance review; merge → downstream ack tracking; disclosure → accounting entry; termination → same-day revocation evidence.
