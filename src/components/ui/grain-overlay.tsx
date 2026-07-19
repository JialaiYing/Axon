/** Mount once per root layout (landing root, dashboard shell). Purely decorative. */
export function GrainOverlay() {
  return (
    <>
      <div aria-hidden className="grain-overlay" />
      <div aria-hidden className="vignette-overlay" />
    </>
  );
}
