(() => {
  if (!document.querySelector(".night-sky")) return;

  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let enabled = !preference.matches;
  const trail = document.createElement("div");
  trail.className = "starlight-trail";
  trail.setAttribute("aria-hidden", "true");
  document.body.append(trail);
  let lastSparkle = 0;

  trail.addEventListener("animationend", (event) => {
    if (event.target !== trail) event.target.remove();
  });

  document.addEventListener("pointermove", (event) => {
    if (!enabled || document.hidden || event.pointerType !== "mouse") return;
    const now = performance.now();
    if (now - lastSparkle < 24) return;
    lastSparkle = now;

    // A bounded, short-lived trail; no render loop runs when the mouse stops.
    for (let index = 0; index < 2; index += 1) {
      if (trail.childElementCount >= 64) trail.firstElementChild.remove();
      const sparkle = document.createElement("span");
      sparkle.className = index === 0 ? "cursor-sparkle" : "cursor-sparkle is-dust";
      sparkle.style.left = `${event.clientX + (Math.random() - 0.5) * 18}px`;
      sparkle.style.top = `${event.clientY + (Math.random() - 0.5) * 18}px`;
      sparkle.style.setProperty("--size", `${6 + Math.random() * 8}px`);
      sparkle.style.setProperty("--drift-x", `${(Math.random() - 0.5) * 32}px`);
      sparkle.style.setProperty("--drift-y", `${12 + Math.random() * 26}px`);
      sparkle.style.setProperty("--lifetime", `${650 + Math.random() * 450}ms`);
      trail.append(sparkle);
    }
  }, { passive: true });

  function update() {
    document.body.dataset.skyPaused = String(!enabled || document.hidden);
    if (!enabled || document.hidden) trail.replaceChildren();
  }

  preference.addEventListener("change", () => {
    enabled = !preference.matches;
    update();
  });
  document.addEventListener("visibilitychange", update);
  update();
})();
