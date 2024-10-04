<template>
  <div id="app" class="d-flex flex-column vh-100">
    <!-- Header -->
    <header class="sticky-top bg-white text-white shadow-sm">
      <div class="container">
      <nav class="navbar navbar-expand-lg navbar-dark">
        <div class="container-fluid">
          <h1 class="navbar-brand mb-0 h1 fw-bold">IndicParler TTS</h1>
          <div class="d-flex align-items-center">
            <select v-model="selectedLanguage" @change="handleLanguageChange" class="form-select form-select-sm me-2">
              <option v-for="lang in availableLanguages" :key="lang" :value="lang">{{ lang }}</option>
            </select>
            <button class="navbar-toggler border-0" type="button" @click="toggleSidebar" aria-label="Toggle navigation">
              <span class="navbar-toggler-icon"></span>
            </button>
          </div>
        </div>
      </nav>
    </div>
    </header>

    <!-- Main content -->
    <div class="container-fluid flex-grow-1 d-flex flex-column flex-lg-row overflow-auto">
      <!-- Left Sidebar for Page Navigation -->
      <nav :class="['col-lg-2 bg-light sidebar left-sidebar', { 'show': showSidebar }]">
        <div class="sidebar-sticky">
          <h2 class="sidebar-heading">Pages</h2>
          <ul class="nav flex-column">
            <li class="nav-item" v-for="(page, index) in pages" :key="index">
              <a class="nav-link" @click="loadPage(page)" :class="{ active: currentPage === page }">
                {{ page.title }}
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Main Content Area -->
      <main class="col-12 col-lg-8 px-4 flex-grow-1 overflow-auto">
        <h1 class="mt-4 mb-4">{{ currentPageTitle }}</h1>
        <div v-for="(sample, index) in currentSamples" :key="index" class="sample-container" :id="'sample' + index">
          <h3>{{ sample.language }} - Sample {{ index + 1 }}</h3>
          <p><strong>Text:</strong> {{ sample.text }}</p>
          <p><strong>Transliteration:</strong> {{ sample.transliteration }}</p>
          <p><strong>Description:</strong> {{ sample.description }}</p>
          <audio :src="sample.audio" controls preload="none" class="w-100 mb-4"></audio>
        </div>
      </main>

      <!-- Right Sidebar for ToC -->
      <nav class="col-lg-2 d-none d-lg-block bg-light sidebar right-sidebar">
        <div class="sidebar-sticky">
          <h2 class="sidebar-heading">Languages</h2>
          <ul class="nav flex-column">
            <li class="nav-item" v-for="(samples, language) in groupedSamples" :key="language">
              <a class="nav-link" @click="toggleLanguage(language)" :class="{ active: isLanguageActive(language) }">
                {{ language }}
                <span class="float-right">{{ isLanguageExpanded(language) ? '▼' : '►' }}</span>
              </a>
              <transition name="fade">
                <ul v-if="isLanguageExpanded(language)" class="nav flex-column ml-3">
                  <li class="nav-item" v-for="(sample, index) in samples" :key="index">
                    <a class="nav-link small" :href="'#sample' + sample.index" @click="setActiveLanguage(language)">
                      Sample {{ sample.index + 1 }}
                    </a>
                  </li>
                </ul>
              </transition>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const pages = ref([]);
    const currentPage = ref(null);
    const currentSamples = ref([]);
    const expandedLanguages = ref(new Set());
    const activeLanguage = ref(null);
    const showSidebar = ref(false);
    const selectedLanguage = ref('Assamese');
    const availableLanguages = ref([]);

    const loadMetadata = async () => {
      try {
        const response = await fetch('metadata.json');
        const data = await response.json();
        pages.value = data.pages;
        loadPageFromUrl();
        updateAvailableLanguages();
      } catch (error) {
        console.error('Error loading metadata:', error);
      }
    };

    const loadPageFromUrl = () => {
      const pageTitle = route.query.page;
      if (pageTitle) {
        const page = pages.value.find(p => p.title === pageTitle);
        if (page) {
          loadPage(page);
        } else {
          loadPage(pages.value[0]);
        }
      } else {
        loadPage(pages.value[0]);
      }
    };

    const loadPage = (page) => {
      currentPage.value = page;
      updateCurrentSamples();
      expandedLanguages.value.clear();
      activeLanguage.value = null;
      showSidebar.value = false;
      
      // Update URL when page changes
      router.push({ query: { page: page.title } });
    };

    const updateCurrentSamples = () => {
      currentSamples.value = currentPage.value.samples
        .filter(sample => sample.language === selectedLanguage.value)
        .map((sample, index) => ({...sample, index}));
    };

    const updateAvailableLanguages = () => {
      const languages = new Set();
      pages.value.forEach(page => {
        page.samples.forEach(sample => {
          languages.add(sample.language);
        });
      });
      availableLanguages.value = Array.from(languages);
    };

    const handleLanguageChange = (event) => {
      selectedLanguage.value = event.target.value;
      updateCurrentSamples();
    };

    const toggleLanguage = (language) => {
      if (expandedLanguages.value.has(language)) {
        expandedLanguages.value.delete(language);
      } else {
        expandedLanguages.value.clear();
        expandedLanguages.value.add(language);
      }
      scrollToLanguage(language);
    };

    const isLanguageExpanded = (language) => expandedLanguages.value.has(language);
    const isLanguageActive = (language) => activeLanguage.value === language;
    const setActiveLanguage = (language) => activeLanguage.value = language;

    const scrollToLanguage = (language) => {
      const element = currentSamples.value.find(sample => sample.language === language);
      if (element) {
        document.getElementById('sample' + element.index)?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    const handleScroll = () => {
      const samples = currentSamples.value;
      for (let i = samples.length - 1; i >= 0; i--) {
        const element = document.getElementById('sample' + samples[i].index);
        if (element?.getBoundingClientRect().top <= 100) {
          setActiveLanguage(samples[i].language);
          expandedLanguages.value.add(samples[i].language);
          break;
        }
      }
    };

    const toggleSidebar = () => showSidebar.value = !showSidebar.value;

    onMounted(() => {
      loadMetadata();
      window.addEventListener('scroll', handleScroll);
    });

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll);
    });

    // Watch for route changes
    watch(() => route.query.page, loadPageFromUrl);

    // Watch for language changes
    watch(selectedLanguage, updateCurrentSamples);

    const currentPageTitle = computed(() => currentPage.value ? currentPage.value.title : '');
    const groupedSamples = computed(() => {
      return currentSamples.value.reduce((acc, sample) => {
        if (!acc[sample.language]) {
          acc[sample.language] = [];
        }
        acc[sample.language].push(sample);
        return acc;
      }, {});
    });

    return {
      pages,
      currentPage,
      currentSamples,
      expandedLanguages,
      activeLanguage,
      showSidebar,
      selectedLanguage,
      availableLanguages,
      loadPage,
      toggleLanguage,
      isLanguageExpanded,
      isLanguageActive,
      setActiveLanguage,
      toggleSidebar,
      handleLanguageChange,
      currentPageTitle,
      groupedSamples
    };
  }
};
</script>

<style scoped>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

.sidebar {
  position: fixed;
  top: 56px; /* Adjust based on your navbar height */
  bottom: 0;
  z-index: 100;
  padding: 20px 0;
  overflow-y: auto;
  transition: transform 0.3s ease-in-out;
}

.left-sidebar {
  left: 0;
  border-right: 1px solid #dee2e6;
  transform: translateX(-100%);
}

.right-sidebar {
  right: 0;
  border-left: 1px solid #dee2e6;
}

.sidebar.show {
  transform: translateX(0);
}

@media (min-width: 992px) {
  .sidebar {
    position: sticky;
    top: 56px;
    height: calc(100vh - 56px);
    transform: none;
  }
}

.sidebar-sticky {
  position: sticky;
  top: 20px;
  height: calc(100vh - 76px);
  padding-top: 0.5rem;
  overflow-x: hidden;
  overflow-y: auto;
}

.sidebar-heading {
  font-size: 1.2rem;
  font-weight: bold;
  padding: 10px 15px;
  margin-bottom: 10px;
}

.nav-link {
  color: #495057;
  cursor: pointer;
}

.nav-link:hover, .nav-link.active {
  color: #007bff;
  background-color: #e9ecef;
}

.nav-link.small {
  padding: 0.25rem 1rem;
  font-size: 0.875rem;
}

.sample-container {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  padding: 20px;
  margin-bottom: 20px;
}

h1 {
  color: #007bff;
}

h3 {
  color: #6c757d;
}

audio {
  outline: none;
}

.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.nav-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-link span {
  font-size: 0.8em;
}

@media (max-width: 991.98px) {
  .right-sidebar {
    display: none;
  }
}

.navbar-brand {
  font-size: 1.5rem;
  letter-spacing: 0.5px;
}

.form-select {
  max-width: 150px;
}

@media (max-width: 576px) {
  .navbar-brand {
    font-size: 1.2rem;
  }
  
  .form-select {
    max-width: 120px;
  }
}

</style>