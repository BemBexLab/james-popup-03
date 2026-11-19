document.addEventListener("alpine:init", () => {
  Alpine.directive("image", (element, { expression }, { evaluateLater, effect, cleanup }) => {
    const readSource = evaluateLater(expression);
    const frame = element.parentElement;
    let revision = 0;

    effect(() => readSource((source) => {
      const currentRevision = ++revision;
      frame.dataset.state = source ? "loading" : "empty";
      frame.setAttribute("aria-busy", String(Boolean(source)));
      element.removeAttribute("src");
      if (!source) return;

      // Decode before revealing; ignore results from an earlier slide selection.
      const pending = new Image();
      pending.onload = async () => {
        if (currentRevision !== revision) return;
        try {
          element.src = source;
          await element.decode();
          if (currentRevision !== revision) return;
          frame.dataset.state = "loaded";
        } catch {
          if (currentRevision !== revision) return;
          frame.dataset.state = "error";
          element.removeAttribute("src");
        }
        frame.setAttribute("aria-busy", "false");
      };
      pending.onerror = () => {
        if (currentRevision !== revision) return;
        frame.dataset.state = "error";
        frame.setAttribute("aria-busy", "false");
      };
      pending.src = source;
    }));
    cleanup(() => { revision += 1; });
  });

  Alpine.data("danceBattle", () => ({
    teams: [],
    slides: [],
    activeSlide: 0,
    loadError: false,
    isLoading: true,
    init() {
      this.loadBattle();
    },
    async loadBattle() {
      this.loadError = false;
      this.isLoading = true;
      try {
        // The Laravel API can return the same teams/slides structure.
        const response = await fetch("dummy.json");
        if (!response.ok)
          throw new Error(`Battle request failed (${response.status})`);
        const data = await response.json();
        this.teams = data.teams;
        this.slides = data.slides;
        this.activeSlide = 0;
      } catch (error) {
        this.loadError = true;
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },
    toggleSubscription(team, button) {
      team.subscribed = !team.subscribed;
      // Restart feedback on rapid clicks without queuing animations.
      button.getAnimations().forEach((animation) => animation.cancel());
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      button.animate(
        team.subscribed
          ? [
              { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(255, 211, 52, 0.5)" },
              { transform: "scale(0.94)", offset: 0.18 },
              { transform: "scale(1.07)", offset: 0.5 },
              { transform: "scale(1)", boxShadow: "0 0 0 10px rgba(255, 211, 52, 0)" },
            ]
          : [
              { transform: "scale(1)" },
              { transform: "scale(0.96)" },
              { transform: "scale(1)" },
            ],
        {
          duration: team.subscribed ? 480 : 220,
          easing: "ease-out",
        },
      );
    },
    selectSlide(index) {
      if (!this.slides.length) return;
      this.activeSlide = (index + this.slides.length) % this.slides.length;
      this.$nextTick(() => {
        const strip = this.$refs.thumbnails;
        const button = strip.querySelectorAll("button")[this.activeSlide];
        const zoom = strip.getBoundingClientRect().width / strip.clientWidth;
        const delta =
          (button.getBoundingClientRect().left -
            strip.getBoundingClientRect().left) /
          zoom;
        strip.scrollTo({
          left:
            strip.scrollLeft +
            delta -
            (strip.clientWidth - button.offsetWidth) / 2,
          behavior: "instant",
        });
      });
    },
  }));
});
