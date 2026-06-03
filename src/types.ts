// Re-export the shared analysis contract used by the backend function so the
// frontend renders against the exact same types.
export type {
  AnalysisResult,
  PiiFinding,
  PartitionFinding,
  Suggestion,
  Severity,
} from "../functions/_lib/types";

import type { AnalysisResult } from "../functions/_lib/types";

/** A saved analysis run stored under users/{uid}/analyses/{id}. */
export interface AnalysisRecord {
  id: string;
  fileName: string;
  sqlText: string;
  result: AnalysisResult;
  createdAt: number; // epoch ms (client timestamp for ordering/display)
}
