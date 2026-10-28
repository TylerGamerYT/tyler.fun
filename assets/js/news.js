// "View More" on the News & Releases page: reveals the releases older than v1.0.
(function () {
  const button = document.getElementById("viewMoreBtn");
  const older = document.getElementById("olderReleases");

  if (!button || !older) return;

  button.addEventListener("click", () => {
    older.hidden = false;
    button.setAttribute("aria-expanded", "true");
    button.parentElement.hidden = true;

    // The button disappears, so move focus to the first revealed release
    const firstRelease = older.querySelector("a");
    if (firstRelease) firstRelease.focus({ preventScroll: true });
  });
})();
