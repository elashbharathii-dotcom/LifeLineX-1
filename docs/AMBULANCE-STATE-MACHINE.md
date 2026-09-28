# LifelineX — Ambulance & Trip State Machine Specification

**Standard**: Deterministic Finite State Automaton (DFA) for Emergency Response  

---

## 1. Linear Trip Lifecycle Automaton

```
[REQUESTED] ──► [ACCEPTED] ──► [EN_ROUTE] ──► [ARRIVED] ──► [TRANSPORTING] ──► [COMPLETED]
     │               │              │             │               │
     ▼               ▼              ▼             ▼               ▼
 [CANCELLED]    [CANCELLED]    [CANCELLED]   [CANCELLED]     [CANCELLED]
```

---

## 2. Transition Guard Rules

| Current State | Permitted Next States | Validation Rules & Preconditions |
| :--- | :--- | :--- |
| `REQUESTED` | `ACCEPTED`, `CANCELLED` | Request is open and ambulance is `AVAILABLE`. |
| `ACCEPTED` | `EN_ROUTE`, `CANCELLED` | Driver has acknowledged pickup route. |
| `EN_ROUTE` | `ARRIVED`, `CANCELLED` | Vehicle has arrived within ≤ 100m of pickup coordinates. |
| `ARRIVED` | `TRANSPORTING`, `CANCELLED` | Patient is onboarded and destination hospital is confirmed. |
| `TRANSPORTING`| `COMPLETED`, `CANCELLED` | Vehicle has arrived at trauma center entrance. |
| `COMPLETED` | *(Terminal)* | Ambulance resets status to `AVAILABLE`. |
| `CANCELLED` | *(Terminal)* | Ambulance resets status to `AVAILABLE`. |
