# LifelineX — UI Component Architecture

---

## 1. Hierarchy & Directory Layout

```
src/
├── components/
│   ├── shell/
│   │   ├── AppSidebar.tsx       # Desktop role-aware collapsible sidebar
│   │   ├── AppTopbar.tsx        # Enterprise header (connectivity, profile, theme, notifs)
│   │   └── AppBottomNav.tsx     # Mobile-optimized 5-item touch navigation
│   ├── ui/
│   │   └── index.ts             # Atomic primitives: Button, Card, Badge, MetricCard,
│   │                            # EmptyState, ErrorState, Skeleton
│   ├── emergency/
│   │   ├── EmergencyButton.tsx  # SOS trigger + triage modal + location verification
│   │   └── EmergencyTracker.tsx # 10-state linear progress stepper & live dispatch view
│   ├── maps/
│   │   ├── PatientMap.tsx       # Filtered trauma centers & assigned ambulance only
│   │   ├── DonorMap.tsx         # Anonymized ~800m approximate match pool
│   │   ├── HospitalMap.tsx      # Inbound patient emergency telemetry
│   │   ├── BloodBankMap.tsx     # Regional donor density & urgent request nodes
│   │   ├── AmbulanceMap.tsx     # Turn-by-turn routing & destination coordinates
│   │   └── AdminMap.tsx         # Unified incident supervision overview
│   ├── donor/                   # Donor availability command & chain invite cards
│   ├── hospital/                # Command center, capacity metrics, triage queues
│   ├── bloodbank/               # Atomic stock management & blood group bars
│   ├── ambulance/               # Fleet driver cockpit & trip state stepper
│   ├── appointments/            # Single-seat booking & QR pass generator
│   ├── ai/                      # Guardrailed clinical coordination chat
│   ├── admin/                   # Identity verification queue & audit log explorer
│   └── notifications/           # Drawer with audio chime controls
```

---

## 2. Component Design Principles

1. **Role-Aware Filtering**: Navigation elements only expose tools permissible for the authenticated session (`getRoleNavItems`).
2. **Predictable State Bounds**: Every async action handles `loading`, `error`, `empty`, and `success` states with dedicated UI components.
3. **Strict Decoupling**: View components consume application contexts (`AuthContext`, `EmergencyContext`, `ThemeLanguageContext`) and service adapters (`databaseAdapter`, `notificationService`) without baking ad-hoc networking calls directly into templates.
