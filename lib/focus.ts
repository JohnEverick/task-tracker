/** Length of a focus block for a task: its estimate, kept between 15 and 90 minutes. */
export function focusBlockSeconds(estimateMins: number): number {
  return Math.min(Math.max(estimateMins, 15), 90) * 60;
}

export const EXTEND_SECONDS = 5 * 60;
