import { defineStore } from "pinia";
import { ref } from "vue";

export const useThemeStore = defineStore("theme", () => {
  const theme = ref<string>(localStorage.getItem("theme") || "light");

  function applyTheme(t: string) {
    if (typeof document !== "undefined") {
      if (t === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  }

  function setTheme(t: "dark" | "light") {
    theme.value = t;
    try {
      localStorage.setItem("theme", t);
    } catch (_) {}
    applyTheme(t);
  }

  function toggleTheme() {
    setTheme(theme.value === "dark" ? "light" : "dark");
  }

  function init() {
    applyTheme(theme.value);
  }

  return { theme, setTheme, toggleTheme, init };
});
