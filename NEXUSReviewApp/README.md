# NEXUSReviewApp — Fraud Analyst Review Form

UiPath **Coded Action App** (React + TypeScript) rendered inside Action Center for the
`WireFraudDispute` case's ManualReview stage. Built with `@uipath/coded-action-app`.

The analyst sees the case ID, disputed amount, a color-coded fraud-score gauge, the AI
recommendation, the evidence summary, and the case narrative — then decides:

| Button | Outcome | Sets `analystDecision` |
|--------|---------|-------------------------|
| Confirm Recall | `ConfirmRecall` | `recall_initiated` |
| Override — No Action | `OverrideNoAction` | `no_action` |

Optional `analystNotes` are captured for the audit record. The form honors Action Center's
light/dark theme and read-only state (completed / reassigned tasks).

## Data contract

Defined in [action-schema.json](action-schema.json):

- **Inputs** (bound from case variables): `caseId`, `transactionAmount` (number — the case
  task binds it via `parseFloat(vars.transactionAmount)`), `fraudScore`, `evidenceSummary`,
  `resolutionAction` (the AI recommendation), `caseNarrative`
- **Outputs**: `analystDecision`, `analystNotes`
- **Outcomes**: `ConfirmRecall`, `OverrideNoAction`

## Build & deploy

```bash
npm install
npm run build                                            # tsc + vite → dist/
uip codedapp pack dist -n NEXUSReviewApp --version <x>   # bump version on every re-publish
uip codedapp publish -t Action                           # -t Action is required
uip codedapp deploy -n nexusreviewapp --folder-key <folder-key>
```

Currently deployed to the **Agents/VoiceLRWF** folder (staging `mvporgruss`) and selected
as the Action for the "Review Wire Fraud Case" task in the case plan.

> **Windows / Google Drive note:** npm cannot reliably write `node_modules` inside a
> Drive-streamed folder. If `npm install` fails with `TAR_ENTRY_ERROR`/`EBADF`, copy the
> app (without `node_modules`/`dist`) to a local disk, build there, and copy `dist/` back —
> or build on macOS where the folder is mirrored locally.
