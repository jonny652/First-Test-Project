import { type BrowserContext, type Route } from "@playwright/test";

const GRAPHQL_URL = "https://api.source.thenbs.com/graphql";

interface CertificationsMatch {
  container: Record<string, unknown>;
  key: string;
  array: unknown[];
}

/** True for objects shaped like a real certification (confirmed against a live response — each has a "certificationType" field). */
function isLikelyCertificationItem(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "certificationType" in (value as Record<string, unknown>)
  );
}

/**
 * Depth-first search for the first array whose elements are shaped like real
 * certifications. This is the primary, most reliable match: a plain
 * /certificat/i key-name match can land on the wrong array, since the real
 * data sits alongside sibling arrays in the same response (e.g.
 * `certifications.byBrandId.paginatedResponse` has both a "facets" array and
 * the real "items" array) — shape-checking the elements avoids that.
 */
function findArrayByShape(node: unknown): CertificationsMatch | null {
  if (node === null || typeof node !== "object") return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findArrayByShape(item);
      if (found) return found;
    }
    return null;
  }

  const record = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value) && value.some(isLikelyCertificationItem)) {
      return { container: record, key, array: value };
    }
  }
  for (const value of Object.values(record)) {
    const found = findArrayByShape(value);
    if (found) return found;
  }
  return null;
}

/** Fallback for when there are no elements left to shape-check (e.g. an already-empty array) — nearest array beneath a /certificat/i-matching key. */
function findArrayByKeyName(node: unknown): CertificationsMatch | null {
  if (node === null || typeof node !== "object") return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findArrayByKeyName(item);
      if (found) return found;
    }
    return null;
  }

  const record = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (/certificat/i.test(key) && Array.isArray(value)) {
      return { container: record, key, array: value };
    }
  }
  for (const value of Object.values(record)) {
    const found = findArrayByKeyName(value);
    if (found) return found;
  }
  return null;
}

/**
 * The GraphQL endpoint is shared by every query the page fires, so there's no
 * per-request URL to match on — search the parsed response body instead.
 * This naturally leaves unrelated queries on the same endpoint untouched,
 * without needing to hardcode an operationName.
 */
function findCertificationsArray(node: unknown): CertificationsMatch | null {
  return findArrayByShape(node) ?? findArrayByKeyName(node);
}

type CertificationsTransform = (match: CertificationsMatch) => void;

/**
 * Shared plumbing for every certifications stub: let the real request
 * through, find the certifications array in the real response, and apply
 * `transform` to it before fulfilling. Requests that aren't the
 * certifications query (or any other GraphQL op sharing this endpoint) pass
 * through unmodified.
 */
function createCertificationsStub(transform: CertificationsTransform) {
  return async function setup(context: BrowserContext): Promise<void> {
    await context.route(GRAPHQL_URL, async (route: Route) => {
      const response = await route.fetch();
      const json: unknown = await response.json();
      const match = findCertificationsArray(json);

      if (!match) {
        // route.fetch() already performed the network round-trip, so
        // route.continue() is not valid here — fulfill with the real,
        // unmodified response instead.
        await route.fulfill({ response });
        return;
      }

      transform(match);
      await route.fulfill({ response, json });
    });
  };
}

/**
 * Like createCertificationsStub, but fails the request instead of
 * transforming it. Can't just fulfill every request to GRAPHQL_URL with an
 * error status — the Background steps (search, open the manufacturer page)
 * hit this same shared endpoint before the Certifications tab is ever
 * opened, and would break too. So this still fetches the real response and
 * shape-checks it first, only replacing the certifications request
 * specifically; everything else passes through untouched.
 */
function createCertificationsErrorStub(status: number) {
  return async function setup(context: BrowserContext): Promise<void> {
    await context.route(GRAPHQL_URL, async (route: Route) => {
      const response = await route.fetch();
      const json: unknown = await response.json();
      // Only the shape-based match, not findCertificationsArray's key-name
      // fallback: a general brand-overview request (fired during the
      // Background's own navigation, before the Certifications tab is ever
      // opened) happens to carry its own always-empty "certifications": []
      // field, which the fallback matches by key name alone. Emptying/
      // renaming that via the other stubs is a harmless no-op, but 500-ing
      // that unrelated request here breaks the page's real navigation.
      // Shape-checking is more precise and doesn't have this problem.
      const match = findArrayByShape(json);

      if (!match) {
        await route.fulfill({ response });
        return;
      }

      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({ errors: [{ message: "Internal Server Error" }] }),
      });
    });
  };
}

/**
 * Like createCertificationsErrorStub, but aborts the request instead of
 * fulfilling it with an error status — simulates a dropped connection where
 * no response arrives at all. Same reasoning as the error stub: can't abort
 * every request to GRAPHQL_URL, since the Background's own navigation hits
 * this shared endpoint too, so this still fetches the real response and
 * shape-checks it first, only aborting the certifications request itself.
 */
function createCertificationsAbortStub() {
  return async function setup(context: BrowserContext): Promise<void> {
    await context.route(GRAPHQL_URL, async (route: Route) => {
      const response = await route.fetch();
      const json: unknown = await response.json();
      const match = findArrayByShape(json);

      if (!match) {
        await route.fulfill({ response });
        return;
      }

      await route.abort("connectionclosed");
    });
  };
}

export type NetworkStubSetup = (context: BrowserContext) => Promise<void>;

// To add a new API test scenario:
//   1. Tag a scenario in the .feature file, e.g. @stub-error-certifications
//   2. Add a matching entry to the registry below, keyed by that exact tag
// hooks.ts automatically picks up any tag it finds a match for here and
// registers its stub before the page loads — no other wiring needed.
//
// Not every stub needs createCertificationsStub (which fetches the real
// response and edits the certifications array in it). For simpler cases you
// can write a plain function instead, e.g.:
//   - a server error: route.fulfill({ status: 500 })
//   - a slow response: wait, then route.fulfill(...)
//   - a dropped connection: route.abort()
export const networkStubRegistry: Record<string, NetworkStubSetup> = {
  "@stub-empty-certifications": createCertificationsStub((match) => {
    match.container[match.key] = [];
  }),

  "@stub-certifications": createCertificationsStub((match) => {
    if (match.array.length === 0) return;
    const first = match.array[0] as Record<string, unknown>;
    first.name = "Stubbed Test Certification";
  }),

  "@stub-server500-error": createCertificationsErrorStub(500),

  // 200 OK, but the certifications field itself is missing from the
  // response — distinct from @stub-empty-certifications, which returns a
  // valid (empty) array and triggers the "no results" messaging. Deleting
  // the field simulates the data the UI needs being absent outright.
  "@stub-malformed-certifications": createCertificationsStub((match) => {
    delete match.container[match.key];
  }),

  "@stub-abort-certifications": createCertificationsAbortStub(),
};

export async function applyNetworkStubs(context: BrowserContext, tagNames: string[]): Promise<void> {
  for (const tag of tagNames) {
    const setup = networkStubRegistry[tag];
    if (setup) {
      await setup(context);
    }
  }
}
