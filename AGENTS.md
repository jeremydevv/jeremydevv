# CrossView Repository Guidance

## Project intent

This repository implements **CrossView**, a recruiter-facing demonstration of multi-camera vehicle detection and short-lived cross-camera re-identification across nearby Manhattan traffic cameras.

Use [`context/NYC_Multi_Camera_Vehicle_Tracking_Technical_Brief.pdf`](context/NYC_Multi_Camera_Vehicle_Tracking_Technical_Brief.pdf) as the product and research source of truth. The brief contains both firm safety requirements and provisional technical recommendations. Preserve the firm requirements below; validate recommendations through measurement before treating them as architecture commitments.

The system should:

- ingest public traffic-camera snapshots at an expected cadence of about 15 seconds;
- detect and crop vehicles in memory;
- associate detections locally and across physically reachable cameras;
- maintain temporary, confidence-aware vehicle sessions;
- visualize probable routes, ambiguity, performance, and cost; and
- demonstrate distributed-systems, computer-vision, and privacy-aware engineering.

Do not describe the system as perfectly identifying or continuously tracking vehicles. Prefer terms such as `probable route`, `candidate match`, `snapshot-to-snapshot association`, and `last confirmed sighting`.

## Non-negotiable privacy and safety boundaries

- Delete source snapshots immediately after inference. Do not turn the transient feed into an object-storage archive.
- Expire all vehicle-level session data no later than one hour after the first sighting, and sooner when the session is lost or confidence falls below the continuation threshold.
- Enforce retention in code and storage TTLs. Do not provide an administrative bypass that extends a session past its maximum TTL.
- Do not collect, infer, retain, hash, search, or expose license-plate text or plate-derived identifiers.
- Do not perform facial recognition, owner identification, or owner lookup.
- Do not create stable vehicle identifiers, cross-day histories, repeated-location profiles, or permanent route histories.
- Do not provide public search by plate, make/model, home area, or repeated location pattern.
- Do not provide download or export of individual route histories.
- Retain only non-identifying aggregate traffic statistics long term.
- Blur or discard visible faces and avoid retaining crops that are not required for the active session.
- Keep at most one best representative crop and, when justified by the UI, one latest crop per active session. Delete redundant, rejected, duplicate, corrupt, and expired images immediately.
- Keep administrative audit logs for access and configuration changes, but never place prohibited vehicle identifiers or route payloads in logs.
- Prefer synthetic or explicitly consenting vehicles for persistent demonstrations and evaluation artifacts.

Any proposed feature that weakens these boundaries must stop for explicit owner review. Do not implement it behind a flag as a workaround.

## Source authorization

Before integrating or scaling a camera source, verify its current terms, permitted automated processing, attribution requirements, redistribution rights, rate limits, and display restrictions. Store this authorization metadata in the camera registry.

Treat the source links in the brief as research leads, not proof of current permission or availability. Verify current documentation before relying on it.

## System invariants

- Spread requests uniformly across each camera refresh cycle; do not poll all cameras in one burst.
- Suppress duplicate work with `ETag` and `Last-Modified` when available, exact byte hashes otherwise, and perceptual hashes only when overlays change on an otherwise identical frame.
- Keep accepted source frames and transient crops in memory whenever practical.
- Decode JPEGs once, preserve coordinate transforms, and reject stale, corrupt, or unexpectedly small frames before GPU work.
- Treat camera transitions as a directed road graph. Geographic proximity alone is not a valid cross-camera candidate rule.
- Restrict matching to reachable outgoing camera edges, plausible travel-time windows, and the relevant geographic cluster.
- Use selective Re-ID. Generate embeddings for new tracks, materially improved crops, and likely handoffs rather than every repeated detection.
- Prefer a false negative or uncertain/lost session over a false merge between unrelated vehicles.
- Require both a high best-candidate score and a meaningful best-versus-second-best margin. Keep thresholds configurable and evaluation-backed; values in the brief are illustrative defaults, not universal truth.
- Expose uncertainty and alternative or rejected candidates in the UI instead of hiding ambiguity.
- Do not persist raw detector inputs, embeddings, crops, or route events beyond their declared lifecycle.

## Data contracts

The camera registry should include, at minimum:

- stable internal camera ID;
- public snapshot URL;
- latitude and longitude;
- street and intersection labels;
- calibrated direction or bearing;
- expected refresh interval;
- image dimensions;
- source or fetch timestamp behavior; and
- authorization, attribution, and display restrictions.

Directed camera-transition edges should include:

- source and destination camera IDs;
- minimum and maximum plausible travel time;
- direction;
- route distance; and
- transition probability or equivalent calibrated prior.

An active session may contain only the temporary session ID, class, approximate color, representative/latest crop, compact appearance embedding, sightings, route events, confidence metadata, and expiration metadata needed for the live experience. Design schemas so expiration and deletion are straightforward and testable.

## Architecture guidance

Build the simplest measurable version first.

- A Go-only MVP is valid for ingestion, scheduling, APIs, live updates, and initial processing.
- Introduce Rust for decode/resize/crop or cluster-local matching only when profiling shows a meaningful latency, throughput, or memory benefit.
- Use Python for model research, evaluation, and training rather than as an unmeasured production request bottleneck.
- Prefer ONNX Runtime or TensorRT for production inference after benchmarking the chosen detector and Re-ID model.
- Begin with FP16. Adopt INT8 only after calibration demonstrates acceptable accuracy.
- Use PostgreSQL/PostGIS for camera metadata and road topology when persistence is needed.
- Use Redis/Valkey or an equivalent TTL-capable store for active sessions.
- Keep vector indexes cluster-local. HNSW or FAISS are candidates, not mandates.
- Use WebSocket or Server-Sent Events for live updates and MapLibre GL for the map unless repository evidence supports another choice.
- For an MVP, the control plane and state/matching services may share a server; keep boundaries clear enough to split them later.

The target planning envelope is 1,000 cameras, about 66.7 images per second before duplicate suppression, and roughly 6-10 usable vehicle detections per image. These are capacity assumptions, not verified production facts. Benchmark with the actual source domain.

## Cloudflare and delivery standards

When this project uses Cloudflare:

- use `atripix-terraform-websites` for Cloudflare infrastructure, `opennext-cloudflare-cicd` for OpenNext deployment workflows, and `fast-flag-standard` for meaningful behavioral changes;
- use one host-aware application Worker per environment, not one Worker per hostname or product surface;
- use canonical physical resource names in the form `<project>-<resource>-development` and `<project>-<resource>-production`;
- keep binding names consistent across environments while binding to separate development and production state;
- let Terraform own stable supporting infrastructure and Wrangler/OpenNext own application builds, versions, uploads, and deployments;
- inventory and import existing provider resources before proposing replacement;
- keep remote Terraform state locked and keep credentials, tokens, state, plans, and runtime secrets out of the repository;
- use repository-owned GitHub Actions as deployment authority and require protected environment approval for production deployment and Terraform apply; and
- never commit placeholder Flagship application IDs.

Meaningful user-visible, authentication, persistence, integration, API, or operational changes require a fast flag with an owner, a callable disabled path, a fallback, and an expiry no more than 28 days after creation.

Agents may prepare code, configuration, plans, and workflows, but must not commit, push, deploy, upload, publish, apply Terraform, delete provider resources, or perform Cloudflare writes without explicit owner approval for that operation.

## UI and public content

- Build the selected-vehicle view around temporary identity, last confirmed sighting, session duration and expiration, cameras observed, per-handoff confidence, probable route, and visibly uncertain segments.
- Build the operational dashboard around source health, throughput, duplicate suppression, detections, GPU utilization, queue depth, median/p95 latency, active sessions, handoffs, ambiguity, track loss, and cost per million frames.
- Show accepted, rejected, and alternative candidates with understandable confidence information.
- Keep public copy evidence-backed and visitor-facing. Never expose cloud infrastructure, deployment plans, internal intentions, implementation details, or meta-work on normal public pages.
- Do not make accuracy, scale, latency, cost, or camera-count claims unless a reproducible benchmark supports them.
- Prefer shadcn/ui components when practical, including Animate UI variants only when motion improves the interaction.
- Preserve accessibility, responsive behavior, keyboard operation, and reduced-motion preferences.

## Validation and testing

Every meaningful change should be verified in proportion to risk. Add tests for relevant invariants, especially:

- source-frame and crop deletion;
- session TTL enforcement, including process restarts and failure paths;
- duplicate-frame suppression;
- directed transition and travel-time filtering;
- conservative candidate acceptance and best-versus-second-best margins;
- uncertain, rejected, and lost-session behavior;
- absence of prohibited plate, face, owner, stable-ID, and route-export fields;
- aggregate-only long-term persistence;
- queue backpressure and stale-frame rejection; and
- development/production resource isolation.

Maintain a labeled evaluation set with both matches and hard non-matches. Report false merges, false negatives, ambiguous-match rate, track-loss rate, per-camera or per-condition failures, and confidence calibration. Publish methodology and failure cases alongside headline results.

Measure end-to-end throughput rather than quoting vendor FPS. Benchmark 640- and 960-pixel inputs, batching around 16-32 where appropriate, and a bounded batching delay against the 15-second source cadence. Track GPU utilization, queue depth, p95 latency, duplicate rate, usable detections per frame, and cost per million frames.

## Delivery sequence

Work in measured stages unless the owner explicitly changes scope:

1. **50 cameras:** validate source reliability and permissions, ingestion, duplicate suppression, detection, map UI, basic local association, TTL deletion, and one manually verified corridor.
2. **250 cameras:** add the directed road graph, candidate arrival windows, Re-ID evaluation, ambiguity-aware scoring, and lifecycle cleanup under load.
3. **1,000 cameras:** add geographic sharding, redundancy, monitoring, cost reporting, and recruiter-demo polish after the earlier stages meet measured quality gates.

Do not scale camera count before establishing source legality, lifecycle enforcement, representative benchmark data, and acceptable false-merge behavior.

## Working conventions

- Inspect existing code, configuration, tests, and provider state before proposing architectural replacement.
- Keep changes scoped and preserve unrelated user work.
- Do not introduce services, queues, databases, languages, or cloud resources solely because they appear in the research brief; justify them with the current stage and measurements.
- Record assumptions and distinguish measured results from estimates.
- Use real camera and benchmark data only where permitted. Do not add fabricated production metrics or placeholder customer-facing claims.
- Keep secrets and sensitive source credentials out of source control, logs, fixtures, screenshots, and public output.
- Do not commit automatically. Leave changes uncommitted unless the owner explicitly requests a commit or PR workflow.
