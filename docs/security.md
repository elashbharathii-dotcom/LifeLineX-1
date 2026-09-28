# LifelineX — Security & Privacy Architecture

## Security Principles
1. **Row Level Security (RLS)**: Enforced directly at the PostgreSQL layer. Frontend authentication tokens are validated for every query.
2. **Sensitive Data Protection**:
   - Aadhaar/national ID numbers are never stored in raw form.
   - Verification documents are restricted to private Supabase Storage buckets accessible only via signed URLs.
   - Exact home coordinates of donors are never broadcasted; approximate 800m privacy-radius circles are rendered to hospitals until an invitation is accepted.
3. **Medical Safety Guardrails**:
   - Lifeline AI coordination copilot strictly rejects prompts requesting medical diagnosis or drug prescriptions.
   - Automated donor matching is designated as *potential compatibility candidates*; final transfusion clearance requires physical facility cross-matching.
4. **Tamper-Evident Audit Logging**:
   - All mutations on emergency states, blood requests, inventory reservations, and verification approvals are recorded in the `audit_logs` table.
