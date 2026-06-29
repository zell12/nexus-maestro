import { useState, useEffect, ChangeEvent } from 'react';
import { Theme } from '@uipath/coded-action-app';
import { codedActionAppService } from '../uipath';
import './Form.css';

interface FormData {
  // inputs (read-only, from the Maestro case)
  caseId: string;
  transactionAmount: number;
  fraudScore: number;
  evidenceSummary: string;
  resolutionAction: string;
  caseNarrative: string;
  // outputs (set by the analyst)
  analystDecision: string;
  analystNotes: string;
}

const INITIAL: FormData = {
  caseId: '',
  transactionAmount: 0,
  fraudScore: 0,
  evidenceSummary: '',
  resolutionAction: '',
  caseNarrative: '',
  analystDecision: '',
  analystNotes: '',
};

const isDarkTheme = (theme: Theme) =>
  theme === Theme.Dark || theme === Theme.DarkHighContrast;

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const prettify = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const severityOf = (score: number): 'high' | 'medium' | 'low' => {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
};

interface FormProps {
  onInitTheme: (isDark: boolean) => void;
}

function Form({ onInitTheme }: FormProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    codedActionAppService.getTask().then((task) => {
      if (task.data) {
        setFormData((prev) => ({ ...prev, ...(task.data as Partial<FormData>) }));
      }
      setIsReadOnly(task.isReadOnly);
      onInitTheme(isDarkTheme(task.theme));
    });
  }, [onInitTheme]);

  const handleNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (isReadOnly) return;
    const updated = { ...formData, analystNotes: e.target.value };
    setFormData(updated);
    codedActionAppService.setTaskData(updated);
  };

  const complete = async (outcome: string, decision: string) => {
    if (isReadOnly || submitting) return;
    setSubmitting(true);
    const finalData = { ...formData, analystDecision: decision };
    setFormData(finalData);
    try {
      await codedActionAppService.completeTask(outcome, finalData);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRecall = () => complete('ConfirmRecall', 'recall_initiated');
  const handleOverride = () => complete('OverrideNoAction', 'no_action');

  const severity = severityOf(formData.fraudScore);
  const canAct = !isReadOnly && !submitting;

  return (
    <div className="review-form">
      {/* Header */}
      <header className="header">
        <div>
          <p className="eyebrow">NEXUS · Wire Fraud Dispute</p>
          <h1 className="title">Manual Review Required</h1>
        </div>
        <span className="case-chip">{formData.caseId || '—'}</span>
      </header>

      {/* Key figures */}
      <section className="figures">
        <div className="figure">
          <span className="figure-label">Disputed Amount</span>
          <span className="figure-value">
            {formData.transactionAmount ? usd.format(formData.transactionAmount) : '—'}
          </span>
        </div>
        <div className="figure">
          <span className="figure-label">Fraud Risk Score</span>
          <span className={`figure-value score score-${severity}`}>
            {formData.fraudScore || 0}
            <span className="score-denom">/100</span>
          </span>
          <span className={`score-bar score-bar-${severity}`}>
            <span style={{ width: `${Math.min(formData.fraudScore || 0, 100)}%` }} />
          </span>
        </div>
      </section>

      {/* AI recommendation */}
      <section className={`recommendation recommendation-${severity}`}>
        <span className="recommendation-label">AI Recommendation</span>
        <span className="recommendation-value">
          {formData.resolutionAction ? prettify(formData.resolutionAction) : 'Pending'}
        </span>
      </section>

      {/* Evidence */}
      <section className="block">
        <h2 className="block-title">Evidence Summary</h2>
        <p className="block-body">{formData.evidenceSummary || 'No evidence summary provided.'}</p>
      </section>

      <section className="block">
        <h2 className="block-title">Case Narrative</h2>
        <p className="block-body">{formData.caseNarrative || 'No case narrative provided.'}</p>
      </section>

      {/* Analyst notes */}
      <section className="block">
        <h2 className="block-title">
          Analyst Notes <span className="optional">(optional)</span>
        </h2>
        <textarea
          name="analystNotes"
          value={formData.analystNotes}
          onChange={handleNotesChange}
          readOnly={isReadOnly}
          placeholder="Document your reasoning for the audit record..."
          rows={4}
        />
      </section>

      {/* Decision */}
      <footer className="actions">
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleConfirmRecall}
          disabled={!canAct}
        >
          Confirm Recall
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleOverride}
          disabled={!canAct}
        >
          Override — No Action
        </button>
      </footer>

      {isReadOnly && (
        <p className="readonly-note">
          This task is read-only — it has already been completed or is assigned to another reviewer.
        </p>
      )}
    </div>
  );
}

export default Form;
