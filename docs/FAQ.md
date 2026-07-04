# FAQ

**Who is this for, and what problem does it solve?**
Local communities in Ukraine that organized ad-hoc microgrids during
blackouts — neighbors with shared solar panels, batteries, or a generator
who produce and split electricity among themselves. Today that settlement
is manual and trust-based (spreadsheets), which causes disputes and
discourages people from investing in shared generation capacity, since
there's no guarantee they'll get their fair share back. See
[Overview](Overview.md#who-this-is-for) for the full picture.

**Why blockchain, not just a database?**
A database only works if everyone trusts whoever runs it — and in a
peer-to-peer neighbor microgrid, there's no such party. A blockchain removes
that single point of trust: readings, tariffs, and payments are all
independently verifiable transactions, and settlement runs on public code
instead of a backend nobody can inspect. Details in
[Overview](Overview.md#why-blockchain-not-just-a-database).

**Has the protocol been audited?**
Not yet. It's a pre-production prototype on Base Sepolia testnet, built on
established patterns (OpenZeppelin, Solady) with a Hardhat test suite. An
audit is a pre-mainnet gate, planned once the tariff model and oracle design
are finalized — not before, to avoid re-auditing after a redesign. See
[Overview](Overview.md#security--audit-status).

**How does the protocol make money?**
Every settlement transaction carries a flat protocol fee (`Escrow` +
`Main.Fees`), routed to a configurable fee receiver separate from the
supplier payment. That mechanism is the basis for a sustainable model —
funding infrastructure operation independent of grant funding. See
[Overview](Overview.md#monetization--business-model).

**Has this project received funding before?**
Yes. The current contracts, subgraph, and Prometheus/Grafana pipeline were
built under FORWARDER, an international research project funded by CRDF
Global via the Kyiv Polytechnic Science Park, and validated on a physical
lab stand. This grant funds what that foundation doesn't yet have:
quality-aware tariffs, a hardened oracle, and a real pilot. See
[Overview](Overview.md#prior-work--funding) and [Team](Team.md).

**Is peer-to-peer electricity trading legal?**
It's a regulated activity in most jurisdictions, Ukraine included.
DefiEnergySupply is infrastructure software, not a licensed energy supplier,
and today runs only on a public testnet with no real electricity or fiat
changing hands. A real pilot would require engaging Ukrainian energy-market
regulation directly, most likely through a regulatory sandbox. See
[Overview](Overview.md#regulatory-status).
