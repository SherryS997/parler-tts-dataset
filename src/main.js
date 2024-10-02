import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';

const router = createRouter({
  history: createWebHashHistory(), // Change to hash history
  routes: [
    { path: '/', component: App },
    // Add other routes as needed
  ]
});

const app = createApp(App);
app.use(router);
app.mount('#app');
