import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "@vuepic/vue-datepicker/dist/main.css";
import "./style.css";
import { useThemeStore } from "./stores/theme";
import { useAuthStore } from "./stores/auth";
import { apiService } from "./services/api";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// When the server rejects a request as unauthenticated, drop the cached user and
// send them to sign in. Wired here rather than inside the API layer to avoid a
// circular import between the store and the service.
const auth = useAuthStore();
apiService.onUnauthorized = () => {
  auth.clearSession();
  if (router.currentRoute.value.path !== "/login") {
    router.push("/login");
  }
};

// Initialize theme from store so Tailwind dark class is applied early
const theme = useThemeStore();
theme.init();

app.use(router);

app.mount("#app");
