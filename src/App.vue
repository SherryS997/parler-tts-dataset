<template>
  <div id="app" class="d-flex flex-column vh-100">
    <!-- Simplified Header -->
    <header class="sticky-top bg-primary text-white shadow-sm">
      <div class="container-fluid d-flex justify-content-between align-items-center py-2">
        <button class="btn btn-link text-white" @click="toggleSidebar" aria-label="Toggle navigation">
          <i class="fas fa-bars hamburger-icon"></i>
        </button>
        <h1 class="mb-0 h4 fw-bold">IndicParler TTS</h1>
        <select v-model="selectedLanguage" @change="handleLanguageChange" class="form-select form-select-sm" style="max-width: 150px;">
          <option v-for="lang in availableLanguages" :key="lang" :value="lang">{{ lang }}</option>
        </select>
      </div>
    </header>

    <!-- Main content -->
    <div class="container-fluid flex-grow-1 d-flex overflow-hidden">
      <!-- Unified Sidebar -->
      <nav :class="['bg-light sidebar', { 'show': showSidebar }]">
        <div class="sidebar-sticky p-3">
          <h2 class="sidebar-heading h5">Pages</h2>
          <ul class="nav flex-column">
            <li class="nav-item" v-for="(page, index) in pages" :key="index">
              <a class="nav-link" @click="loadPage(page)" :class="{ active: currentPage === page }">
                {{ page.title }}
              </a>
            </li>
          </ul>
          <h2 class="sidebar-heading h5 mt-4">Languages</h2>
          <ul class="nav flex-column">
            <li class="nav-item" v-for="(samples, language) in groupedSamples" :key="language">
              <a class="nav-link" @click="toggleLanguage(language)" :class="{ active: isLanguageActive(language) }">
                {{ language }}
                <span class="float-end">{{ isLanguageExpanded(language) ? '▼' : '►' }}</span>
              </a>
              <ul v-if="isLanguageExpanded(language)" class="nav flex-column ms-3">
                <li class="nav-item" v-for="(sample, index) in samples" :key="index">
                  <a class="nav-link small" :href="'#sample' + sample.index" @click="setActiveLanguage(language)">
                    Sample {{ sample.index + 1 }}
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Main Content Area -->
      <main class="flex-grow-1 overflow-auto p-3" :class="{ 'main-shift': showSidebar }">
        <h2 class="mt-4 mb-4">{{ currentPageTitle }}</h2>
        <!-- Scrollable language buttons -->
        <div class="language-buttons mb-4 overflow-auto">
          <button 
            v-for="lang in availableLanguages" 
            :key="lang" 
            @click="selectedLanguage = lang; handleLanguageChange()"
            class="btn btn-outline-primary me-2"
            :class="{ active: selectedLanguage === lang }"
          >
            {{ lang }}
          </button>
        </div>
        <div v-for="(sample, index) in currentSamples" :key="index" class="sample-container mb-4 p-3 bg-white rounded shadow-sm" :id="'sample' + index">
          <h3 class="h5">{{ sample.language }} - Sample {{ index + 1 }}</h3>
          <div class="sample-text mb-2 p-2 bg-light rounded"><strong>Text:</strong> {{ sample.text }}</div>
          <div class="sample-transliteration mb-2 p-2 bg-light rounded"><strong>Transliteration:</strong> {{ sample.transliteration }}</div>
          <div class="sample-description mb-2 p-2 bg-light rounded"><strong>Description:</strong> {{ sample.description }}</div>
          <audio :src="sample.audio" controls preload="none" class="w-100"></audio>
        </div>
        <button @click="scrollToTop" class="btn btn-primary back-to-top" v-show="showBackToTop">Back to Top</button>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

export default {
  setup() {
    const pages = ref([]);
    const currentPage = ref(null);
    const currentSamples = ref([]);
    const expandedLanguages = ref(new Set());
    const activeLanguage = ref(null);
    const showSidebar = ref(window.innerWidth > 768);
    const selectedLanguage = ref('');
    const availableLanguages = ref([]);
    const showBackToTop = ref(false);

    const handleResize = () => {
      showSidebar.value = window.innerWidth > 768; // Update based on window width
    };

    const loadMetadata = async () => {
      try {
        const response = await fetch('metadata.json');
        const data = await response.json();
        pages.value = data.pages;
        loadPage(pages.value[0]);
        updateAvailableLanguages();
      } catch (error) {
        console.error('Error loading metadata:', error);
      }
    };

    const loadPage = (page) => {
      currentPage.value = page;
      updateCurrentSamples();
      expandedLanguages.value.clear();
      activeLanguage.value = null;
      if (window.innerWidth <= 768) {
        showSidebar.value = false; // Close sidebar on mobile
      }
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
      availableLanguages.value = Array.from(languages).sort();
      if (!selectedLanguage.value && availableLanguages.value.length > 0) {
        selectedLanguage.value = availableLanguages.value[0];
      }
    };

    const handleLanguageChange = () => {
      updateCurrentSamples();
    };

    const toggleLanguage = (language) => {
      if (expandedLanguages.value.has(language)) {
        expandedLanguages.value.delete(language);
      } else {
        expandedLanguages.value.add(language);
      }
    };

    const isLanguageExpanded = (language) => expandedLanguages.value.has(language);
    const isLanguageActive = (language) => activeLanguage.value === language;
    const setActiveLanguage = (language) => activeLanguage.value = language;

    const toggleSidebar = () => showSidebar.value = !showSidebar.value;

    const handleScroll = () => {
      showBackToTop.value = window.scrollY > 200;

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

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    onMounted(() => {
      loadMetadata();
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    });

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
      showBackToTop,
      loadPage,
      toggleLanguage,
      isLanguageExpanded,
      isLanguageActive,
      setActiveLanguage,
      toggleSidebar,
      handleLanguageChange,
      scrollToTop,
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
  background-color: #f8f9fa;
}

.sidebar {
  position: fixed;
  top: 56px;
  bottom: 0;
  left: -250px;
  width: 250px;
  z-index: 1000;
  transition: left 0.3s ease-in-out;
  overflow-y: auto;
}

.sidebar.show {
  left: 0;
}

.sidebar-sticky {
  position: sticky;
  top: 0;
  height: calc(100vh - 56px);
  overflow-x: hidden;
  overflow-y: auto;
}

.nav-link {
  color: #495057;
  cursor: pointer;
}

.nav-link:hover, .nav-link.active {
  color: #007bff;
  background-color: #e9ecef;
}

.main-shift {
  margin-left: 250px;
  transition: margin-left 0.3s ease-in-out;
}

.language-buttons {
  white-space: nowrap;
  padding-bottom: 10px;
}

.language-buttons::-webkit-scrollbar {
  height: 6px;
}

.language-buttons::-webkit-scrollbar-thumb {
  background-color: #007bff;
  border-radius: 3px;
}

.sample-container {
  transition: box-shadow 0.3s ease-in-out;
}

.sample-container:hover {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.back-to-top {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

@media (max-width: 768px) {
  .sidebar {
    left: -100%;
    width: 100%;
  }

  .main-shift {
    margin-left: 0;
  }
}

audio {
  height: 40px;
}

audio::-webkit-media-controls-panel {
  background-color: #f8f9fa;
}

.hamburger-icon {
  color: #ffffff;
  font-size: 1.5rem; /* Adjust size as needed */
}

audio::-webkit-media-controls-play-button {
  background-color: #007bff;
  border-radius: 50%;
}

audio::-webkit-media-controls-play-button:hover {
  background-color: #0056b3;
}
</style>