# LifelineX — Design System Specification

**Version**: 1.0 (Production Healthcare Standard)  
**Font Stack**: Inter (Google Fonts) + system sans-serif fallback  
**Theme**: Deep Medical Dark (Default) & Professional Clinical Light  

---

## 1. Design Philosophy

LifelineX uses a **clinical operations center** aesthetic balancing **speed, clarity, and trust**.  
Critical principles:
- **Calm Authority**: Emergency states provide unmistakable high-contrast cues without panic-inducing animations.
- **Strict Color Restraint**: Red (`--color-critical`) is reserved strictly for genuine life-safety emergencies. Routine UI elements use trustworthy medical blue, neutral slates, and role-specific accents.
- **Information Hierarchy**: Primary operational actions → Active status → Detailed telemetry → History.

---

## 2. Color Tokens

| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `--color-bg-canvas` | `#07090f` | Main viewport canvas |
| `--color-bg-surface` | `#0d1117` | Standard card/panel background |
| `--color-bg-elevated` | `#161b26` | Elevated cards, topbar, active items |
| `--color-border-default` | `#1f2a3d` | Standard container borders |
| `--color-border-strong` | `#2d3e5a` | Input and interactive control borders |
| `--color-primary` | `#2563eb` | Medical blue for primary actions & active tabs |
| `--color-critical` | `#dc2626` | Emergency broadcast & trauma SOS only |
| `--color-success` | `#16a34a` | Confirmed status, verified donors, online GPS |
| `--color-warning` | `#d97706` | Pending requests, timeouts, re-connecting |
| `--color-text-primary` | `#e6edf3` | High-contrast readable headings & text |
| `--color-text-secondary` | `#8b98b1` | Supporting descriptions & table values |
| `--color-text-muted` | `#4e596b` | Captions, timestamps, inactive labels |

---

## 3. Typography Scale

- **Display**: 36px / Extrabold (`--text-4xl`)
- **H1**: 30px / Bold (`--text-3xl`)
- **H2**: 24px / Semibold (`--text-2xl`)
- **H3**: 20px / Semibold (`--text-xl`)
- **Body**: 15px / Regular (`--text-base`)
- **Body Small**: 13px / Regular (`--text-sm`)
- **Label**: 13px / Medium (`--text-sm`)
- **Caption / Meta**: 11px / Regular (`--text-xs`)
- **Metrics / Numbers**: 30px / Tabular figures (`--text-3xl`)

---

## 4. Spacing Scale

`--space-1`: 4px · `--space-2`: 8px · `--space-3`: 12px · `--space-4`: 16px · `--space-5`: 20px · `--space-6`: 24px · `--space-8`: 32px · `--space-12`: 48px

---

## 5. Elevation & Radius

- Small Radius: `4px` (`--radius-sm`)
- Standard Radius: `8px` (`--radius-md`)
- Container Radius: `12px` (`--radius-lg`)
- Card Radius: `16px` (`--radius-xl`)
- Modal / Dialog Radius: `20px` (`--radius-2xl`)
- Pill Radius: `9999px` (`--radius-full`)
