import { calculateOldRegime } from "./calculate-old-regime";
import { calculateNewRegime } from "./calculate-new-regime";

export function compareRegimes(data) {
  const oldResult = calculateOldRegime(data);
  const newResult = calculateNewRegime(data);

  const recommended = oldResult.tax < newResult.tax ? "old" : "new";
  const savings = Math.abs(oldResult.tax - newResult.tax);

  return {
    oldResult,
    newResult,
    recommended,
    savings,
  };
}
