# ADR-004: Socket.io 4.x with Redis Adapter for Realtime Communication

## Status: Accepted
## Date: 2026-03-15
## Decision Makers: Architecture Team

## Context

Concierge requires realtime updates across multiple modules to deliver a responsive operational
experience for front desk staff, security guards, and property managers:

- **Event log live updates**: When a concierge at the front desk logs a package arrival, every
  other staff member viewing the event log for that property sees the new entry appear
  instantly without refreshing. Shift handoffs depend on this.
- **Notification delivery**: Security incidents, maintenance escalations, and emergency
  broadcasts must reach connected clients within seconds, not on next page load.
- **Presence awareness**: Property managers need to see which staff members are currently
  online (e.g., "2 concierge staff active at Building A").
- **Amenity booking conflicts**: When two residents attempt to book the same time slot, the
  second user must see the conflict in realtime before submitting.
- **Multi-tenant rooms**: Each property is an isolated channel. A staff member working across
  3 properties joins 3 rooms. Events in Property A must never leak to Property B's room.
- **Authentication on connection**: WebSocket connections must be authenticated with the same
  JWT used for HTTP requests (ADR-003). Unauthenticated connections are rejected.
- **Horizontal scaling**: The system must support multiple server instances behind a load
  balancer. A message published on Server 1 must reach clients connected to Server 2.
- **Fallback transports**: Some corporate/condo networks block WebSocket upgrades. The
  solution must fall back to HTTP long polling transparently.
- **Binary support**: Future features (real-time photo upload progress for maintenance
  requests, camera feed thumbnails) may require binary frame support.

## Decision

Adopt **Socket.io 4.x** with the **Redis adapter** (`@socket.io/redis-adapter`) for all
realtime communication in Concierge.

### Architecture

```
Client (Browser)
  |
  | Socket.io client (WebSocket with long-polling fallback)
  |
  v
Next.js Custom Server (Node.js)
  |
  | Socket.io Server
  |   - JWT auth middleware (verifies token on connection)
  |   - Namespace: /portal (staff and resident connections)
  |   - Rooms: property:{property_id} (per-property isolation)
  |   - Sub-rooms: property:{property_id}:module:{module} (granular subscriptions)
  |
  | Redis Adapter
  |   - Pub/Sub for cross-instance message delivery
  |   - Presence tracking via Redis sorted sets (ZADD with TTL)
  |
  v
Redis 7.x (ElastiCache, ca-central-1)
  |
  | Pub/Sub channels per room
  | Sorted sets for presence (score = last_seen timestamp)
  |
```

### Room Structure

```
property:{property_id}                    -- all events for a property
property:{property_id}:events             -- event log updates
property:{property_id}:maintenance        -- maintenance request updates
property:{property_id}:amenities          -- booking updates and conflicts
property:{property_id}:notifications      -- targeted notifications
property:{property_id}:presence           -- staff online/offline
user:{user_id}                            -- direct user notifications
```

### Connection Authentication

```typescript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const payload = await verifyJWT(token);
    socket.data.userId = payload.sub;
    socket.data.propertyId = payload.pid;
    socket.data.role = payload.role;
    socket.join(`property:${payload.pid}`);
    socket.join(`user:${payload.sub}`);
    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
});
```

### Event Emission Pattern

When a server-side action creates an event (e.g., API route handler logs a package):

```typescript
// In the API route handler after database write:
io.to(`property:${propertyId}:events`).emit("event:created", {
  id: event.id,
  type: event.type,
  summary: event.summary,
  createdBy: event.createdBy,
  createdAt: event.createdAt,
});
```

The Redis adapter ensures this reaches all clients in that room across all server instances.

## Rationale

1. **Automatic transport fallback**: Socket.io starts with WebSocket and falls back to HTTP
   long polling if the WebSocket upgrade fails. This is critical for condo networks where
   building firewalls or ISP-level proxies may block WebSocket connections. Raw WebSocket
   has no fallback mechanism.

2. **Redis adapter for horizontal scaling**: Socket.io's Redis adapter uses Redis Pub/Sub
   to broadcast events across multiple Node.js instances. This is a proven pattern at scale
   (used by Slack, Trello, and others) and avoids implementing custom cross-instance messaging.

3. **Room abstraction maps to multi-tenancy**: Socket.io rooms are a first-class concept
   that maps directly to property-level isolation. Joining and leaving rooms is a single
   method call. Broadcasting to a room is O(1) regardless of total connected clients.

4. **Mature ecosystem**: Socket.io has 60k+ GitHub stars, extensive documentation, and
   client libraries for browsers, React Native (future mobile app), and Node.js. The
   `@socket.io/redis-adapter` is officially maintained.

5. **Binary support**: Socket.io natively handles binary data (ArrayBuffer, Blob, Buffer)
   alongside JSON, which is needed for future features like real-time photo upload progress
   indicators and camera feed thumbnails.

6. **Connection state recovery**: Socket.io 4.x supports connection state recovery, which
   buffers missed events during brief disconnections (e.g., elevator ride, network hiccup)
   and replays them on reconnect. This prevents staff from missing events during momentary
   connectivity drops.

## Alternatives Considered

### Pusher
- **Pros**: Fully managed, excellent client SDKs, presence channels, simple API.
- **Rejected because**: Per-message and per-connection pricing becomes expensive with
  dozens of staff and hundreds of residents per property, across many properties. Data
  transits through Pusher's infrastructure (US/EU), complicating PIPEDA compliance.
  No self-hosted option. Vendor dependency for a critical operational feature.

### Ably
- **Pros**: Enterprise-grade, message history, global edge network, better reliability
  guarantees than Pusher.
- **Rejected because**: Same pricing and data residency concerns as Pusher. More expensive
  per message. Overkill for the use case (we do not need message history at the realtime
  layer; events are persisted in PostgreSQL).

### Server-Sent Events (SSE)
- **Pros**: Native browser support, no library needed, HTTP-based (no firewall issues),
  simple server implementation.
- **Rejected because**: Unidirectional (server to client only). Client-to-server
  communication requires separate HTTP requests, complicating the programming model.
  No built-in room/channel concept. No binary support. No automatic reconnection with
  missed message replay. Would need to build room management, authentication middleware,
  and cross-instance broadcasting from scratch.

### Raw WebSocket (ws library)
- **Pros**: Minimal overhead, full control, no abstraction layer.
- **Rejected because**: No automatic fallback to long polling. No room abstraction (must
  build manually). No Redis adapter (must build Pub/Sub integration manually). No
  connection state recovery. No acknowledgment/retry mechanism. Essentially, we would be
  rebuilding Socket.io's feature set from scratch.

### Supabase Realtime
- **Pros**: PostgreSQL change-driven, RLS-based authorization, managed service.
- **Rejected because**: Tied to Supabase ecosystem (rejected in ADR-002). Broadcasts are
  triggered by database changes, which does not fit all use cases (presence, typing
  indicators, conflict detection). Cannot authenticate with our custom JWT (ADR-003).

## Consequences

### Positive
- Realtime updates across all modules with a consistent programming model.
- Multi-tenant isolation via rooms with JWT-authenticated connections.
- Horizontal scaling via Redis adapter without custom infrastructure.
- Transparent fallback for restrictive network environments.
- Connection state recovery prevents missed events during brief disconnections.
- Same client library works for browser and future React Native app.

### Negative
- Self-hosted WebSocket infrastructure requires monitoring (connection counts, memory usage,
  Redis Pub/Sub lag).
- Socket.io adds ~45KB to client bundle (gzipped). Acceptable for a management portal but
  worth noting.
- Next.js custom server required to attach Socket.io, which disables some Vercel-specific
  optimizations (automatic serverless scaling).
- Redis becomes a critical infrastructure dependency for realtime features.

### Risks
- **Redis single point of failure**: If Redis goes down, cross-instance messaging breaks
  (single-instance rooms still work). Mitigated by using ElastiCache Multi-AZ with automatic
  failover. Clients gracefully degrade to HTTP polling for data freshness.
- **Connection storms after outage**: If the server restarts, all clients reconnect
  simultaneously. Mitigated by Socket.io's built-in exponential backoff with jitter on
  reconnection attempts.
- **Memory pressure from rooms**: Each room consumes memory on the server. With thousands
  of properties and sub-rooms, memory usage must be monitored. Mitigated by cleaning up
  empty rooms and setting connection limits per server instance.
- **Sticky sessions requirement**: Without the Redis adapter, Socket.io requires sticky
  sessions for HTTP long-polling fallback. With the Redis adapter, this is not required
  for WebSocket connections but is still needed for long-polling. Mitigated by configuring
  ALB sticky sessions as a safety net.

## Related ADRs
- ADR-001: Framework (Socket.io attaches to Next.js custom server)
- ADR-002: Database (events persisted in PostgreSQL, realtime is notification layer only)
- ADR-003: Auth (JWT verified on WebSocket connection handshake)
