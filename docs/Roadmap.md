# Roadmap

## Phase 1 — core protocol hardening

- Contract refactoring across the existing `Main` / `Register` / `Escrow` /
  `EnergyOracle` / `StakingReward` set.
- Oracle / Smart Bridge upgrade: validated, signed meter readings reaching
  the chain instead of plain writes.
- The quality-aware tariff model and its technical specification — moving
  from flat kWh billing to tariffs that factor in voltage, frequency, THD,
  flicker, and power factor.
- Dashboard and metrics updates (subgraph, Prometheus, Grafana) to track the
  new tariff data.
- Updated documentation and demo materials reflecting the new tariff model.

## Phase 2 — real-world pilot

Unlocked once the Phase 1 protocol upgrade is in place; on the Binance
Web3 Resilience Lab track, activation is additionally gated on 2,500+
community votes.

- Integration of a real smart meter / IoT data source, replacing simulated
  readings.
- Pilot infrastructure: deployment, RPC, and hosting for a live, running
  instance rather than a testnet demo.
- Market research and pilot-requirements report — scoping a real community
  or cooperative partner.
- Independent technical review and security assessment of the hardened
  contracts.
- Public-facing materials: landing page, video, and partner-facing
  documentation.
