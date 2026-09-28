# LifelineX — Testing & Verification Guide

## Testing Layers
1. **Interactive In-App Verification Suite**:
   - Navigate to the **System Verification Suite** tab in the application.
   - Click **Run Master E2E Scenario** to automatically execute all 16 sequential validation steps.
2. **Build Verification**:
   - `npm run build`: Validates TypeScript strict mode compliance and JSX compilation.
3. **Database RLS & Constraint Verification**:
   - PostgreSQL check constraints verify positive integers for units and valid ENUM states.
