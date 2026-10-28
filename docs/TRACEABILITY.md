# Traceability Ledger

`TRACEABILITY.json` is generated deterministically by `npm run docs:traceability`. It inventories every normative `REQ-*` identifier from the ten volumes and appendices in canonical Volume I–X, then Appendix, order; it also separates verified local increments from the broader normative specification.

A requirement remains `planned` until its complete owning implementation increment has been delivered and verified. The P0–P4, P5, and narrow P6 entries are evidence-backed local foundations; they do not imply that the broader graph catalog, corpus, causal inference, agents, simulations, hosted services, SDKs, or deployment requirements in the specification are complete.

Run the generator whenever the volumes, appendices, or implementation evidence changes. Do not hand-edit `TRACEABILITY.json`.