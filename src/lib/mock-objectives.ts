import type { Objective } from "@/types";

/**
 * Starting state for a fresh install — no localStorage data yet.
 * Kept as an empty array (rather than deleting the file) so
 * useObjectives' fallback and any future onboarding/demo-data
 * feature have a single, obvious place to hook into.
 */
export const MOCK_OBJECTIVES: Objective[] = [];