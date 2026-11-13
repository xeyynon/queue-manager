// Shapes sent over the wire. Dates are ISO strings; times are from the DB clock.

export type TokenDTO = {
  id: string;
  number: number;
  label: string | null;
  status: "waiting" | "served" | "cancelled";
  position: number;
  createdAt: string;
  servedAt: string | null;
  cancelledAt: string | null;
  lastMove: "up" | "down" | null;
  lastMovedAt: string | null;
};

export type EventDTO = {
  id: string;
  type: "token_added" | "moved_up" | "moved_down" | "served" | "cancelled" | "restored";
  tokenNumber: number | null;
  actorName: string | null;
  waitingAfter: number;
  at: string;
};

export type QueueSummaryDTO = {
  id: string;
  name: string;
  createdAt: string;
  waiting: number;
  oldestWaitingSince: string | null;
  nowServingNumber: number | null;
};

export type QueueStateDTO = {
  queue: { id: string; name: string; createdAt: string };
  waiting: TokenDTO[];
  nowServing: TokenDTO | null;
  recentServed: TokenDTO[];
  /** Serve times (newest first) from the last 2 hours, for the wait estimate. */
  recentServeTimes: string[];
  events: EventDTO[];
  serverNow: string;
};

export type ApiError = { error: { code: string; message: string } };

export type AnalyticsDTO = {
  range: "today" | "7d" | "30d";
  timeZone: string;
  from: string;
  to: string;
  waitingNow: number;
  arrivals: number;
  served: number;
  cancelled: number;
  /** cancelled / (served + cancelled); null when nothing finished yet. */
  cancellationRate: number | null;
  avgWaitSec: number | null;
  medianWaitSec: number | null;
  p90WaitSec: number | null;
  /** Arrivals and serves per bucket (hour for "today", day otherwise). */
  throughput: { bucket: string; arrivals: number; served: number }[];
  bucketUnit: "hour" | "day";
  /** Peak number waiting per bucket, across the selected queue(s). */
  queueLength: { t: string; peak: number }[];
  queueLengthBucketMinutes: number;
  busiest: { bucket: string; arrivals: number } | null;
};
