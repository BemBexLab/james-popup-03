document.addEventListener("alpine:init", () => {
  Alpine.data("danceBattle", () => ({
    teams: [],
    slides: [],
    activeSlide: 0,
    loadError: false,
    init() {
      this.loadBattle();
    },
    async loadBattle() {
      this.loadError = false;
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
      }
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
