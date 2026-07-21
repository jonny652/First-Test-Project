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

export type NetworkStubSetup = (context: BrowserContext) => Promise<void>;

// Add an entry here to bring another network-stub tag online — the Before
// hook in hooks.ts reads each scenario's tags and calls applyNetworkStubs,
// so any Given/When/Then referencing a tag below gets the matching stub
// registered before the page loads. Other stub shapes (a 500, a slow
// response, a dropped connection, a malformed payload) don't need the
// fetch-then-transform plumbing above at all — e.g. route.fulfill({status:
// 500}), a delay before fulfilling, or route.abort().
export const networkStubRegistry: Record<string, NetworkStubSetup> = {
  "@stub-empty-certifications": createCertificationsStub((match) => {
    match.container[match.key] = [];
  }),

  "@stub-certifications": createCertificationsStub((match) => {
    if (match.array.length === 0) return;
    const first = match.array[0] as Record<string, unknown>;
    first.name = "Stubbed Test Certification";
  }),
};

export async function applyNetworkStubs(context: BrowserContext, tagNames: string[]): Promise<void> {
  for (const tag of tagNames) {
    const setup = networkStubRegistry[tag];
    if (setup) {
      await setup(context);
    }
  }
}
