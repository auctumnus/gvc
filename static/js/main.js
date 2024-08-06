const openModal = (el) => {
  el.showModal();
  const backdrop = document.createElement("div");
  backdrop.id = "modal-backdrop";
  document.querySelector("body").appendChild(backdrop);
  requestAnimationFrame(() => {
    el.classList.add("open");
    backdrop.classList.add("open");
  });
  document.documentElement.style.overflow = "hidden";
  if (!el.dataset.managed) {
    el.dataset.managed = true;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal(el);
      }
    });
  }
};

const closeModal = (el) => {
  const backdrop = document.getElementById("modal-backdrop");
  el.classList.remove("open");
  backdrop.classList.remove("open");
  document.documentElement.style.overflow = "auto";
  el.addEventListener(
    "transitionend",
    (_) => {
      el.close();
      document.getElementById("modal-backdrop")?.remove();
    },
    { once: true },
  );
};
