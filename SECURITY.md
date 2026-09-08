# Security

Report suspected vulnerabilities privately to security@inttegro.com. Do not
open a public issue for a vulnerability or include live credentials, payment
details, checkout references, or customer data in a report.

The SDK never accepts an Inttegro secret API key. Merchant servers create and
finalize Orders with a server SDK, while this browser SDK mounts an
Inttegro-hosted checkout surface using a client-safe reference.

## Controlled-origin runtime

The executable payment-collection runtime must always be downloaded from
`https://js.inttegro.com/inttegro.js@0.1.0`. The npm packages contain only the
loader, public types, and framework adapters. They intentionally provide no
runtime URL option and no supported path for bundling, mirroring, proxying, or
self-hosting the runtime.

This lets Inttegro control the exact code that collects sensitive payment data,
ship security fixes centrally, and stop a bad release without waiting for every
merchant to update an npm dependency. It is a security posture, not a claim of
PCI certification or a statement that the current mobile-money flow is in PCI
scope.

The private runtime pipeline builds, verifies, and deploys the hosted artifact
to the controlled origin. Public package releases verify the live runtime's
versioned compatibility manifest before publishing the npm loader and adapters.
Each release URL remains centrally revocable so Inttegro can withdraw a
compromised artifact. Runtime source, build tooling, and edge/CDN configuration
must never be committed to this public repository.
