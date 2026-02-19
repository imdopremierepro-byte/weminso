// ===== App.js — Westminster Shorter Catechism =====

window.addEventListener('load', function () {
    'use strict';

    // ===== DOM Elements =====
    const qaList = document.getElementById('qaList');
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchResultCount = document.getElementById('searchResultCount');
    const filterTags = document.querySelectorAll('.filter-tag');
    const themeToggle = document.getElementById('themeToggle');
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');
    const videoGrid = document.getElementById('videoGrid');
    const videoModal = document.getElementById('videoModal');
    const videoModalBackdrop = document.getElementById('videoModalBackdrop');
    const videoModalClose = document.getElementById('videoModalClose');
    const videoIframe = document.getElementById('videoIframe');
    const videoModalEpisode = document.getElementById('videoModalEpisode');
    const videoModalTitle = document.getElementById('videoModalTitle');
    const videoModalYoutubeLink = document.getElementById('videoModalYoutubeLink');

    let currentFilter = 'all';
    let currentSearch = '';
    let currentLang = 'ko';
    let visibleCount = 20;
    let currentVideoLang = 'all';

    // Additional Elements for Load More
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const videoLangTabs = document.querySelectorAll('.video-lang-tab');
    let lastScroll = 0;

    // ===== Create hero particles =====
    function createParticles() {
        const container = document.getElementById('heroParticles');
        if (!container) return;
        const colors = ['#6C5CE7', '#A29BFE', '#FD79A8', '#00CEC9', '#FDCB6E'];
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.classList.add('hero-particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.animationDuration = (8 + Math.random() * 12) + 's';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.width = (2 + Math.random() * 4) + 'px';
            particle.style.height = particle.style.width;
            container.appendChild(particle);
        }
    }

    // ===== Render Video Grid =====
    function renderVideoGrid() {
        if (!videoGrid || typeof videoData === 'undefined') return;

        const filteredVideos = currentVideoLang === 'all'
            ? videoData.filter(v => v.lang !== 'ost')
            : videoData.filter(v => v.lang === currentVideoLang);

        if (filteredVideos.length === 0) {
            videoGrid.innerHTML = `<div class="no-results"><p>해당 언어의 영상이 아직 없습니다.</p></div>`;
            return;
        }

        const langFlags = { ko: '🇰🇷', en: '🇺🇸', zh: '🇨🇳' };

        videoGrid.innerHTML = filteredVideos.map(video => {
            const flag = langFlags[video.lang] || '';
            return `
        <div class="video-card" data-animate="fade-up" data-delay="${Math.min(video.episode * 50, 600)}"
             onclick="openVideo('${video.videoId}', ${video.episode}, '${escapeAttr(video.title)}')">
          <div class="video-card-thumb">
            <img src="https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg" 
                 alt="${escapeHtml(video.title)}" loading="lazy">
            <div class="video-card-play">
              <div class="video-card-play-btn">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
            </div>
            ${video.lang !== 'ko' ? `<span class="video-card-lang-badge">${flag} ${video.lang.toUpperCase()}</span>` : ''}
          </div>
          <div class="video-card-info">
            <span class="video-card-episode">EP.${String(video.episode).padStart(2, '0')}</span>
            <h4 class="video-card-title">${escapeHtml(video.title)}</h4>
            <p class="video-card-desc">${escapeHtml(video.desc)}</p>
          </div>
        </div>`;
        }).join('');

        // Observe new elements for animations
        videoGrid.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    }

    function escapeAttr(str) {
        return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    }

    // ===== Video Modal =====
    // Always embed in modal (youtube-nocookie.com works with file:// too)
    window.openVideo = function (videoId, episode, title) {
        videoIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
        videoModalEpisode.textContent = `EP.${String(episode).padStart(2, '0')}`;
        videoModalTitle.textContent = title;
        if (videoModalYoutubeLink) {
            videoModalYoutubeLink.href = `https://www.youtube.com/watch?v=${videoId}`;
        }
        videoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    function closeVideoModal() {
        videoModal.classList.remove('active');
        videoIframe.src = '';
        document.body.style.overflow = '';
    }

    videoModalClose.addEventListener('click', closeVideoModal);
    videoModalBackdrop.addEventListener('click', closeVideoModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeVideoModal();
        }
    });

    // ===== Render Q&A List =====
    function renderQA() {
        const filtered = getFilteredData();
        const searchTerm = currentSearch.trim().toLowerCase();

        if (filtered.length === 0) {
            qaList.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <h3>검색 결과가 없습니다</h3>
          <p>다른 키워드로 검색해 보세요</p>
        </div>`;
            searchResultCount.textContent = '';
            if (loadMoreContainer) loadMoreContainer.style.display = 'none';
            return;
        }

        // Slice data for pagination
        const displayData = filtered.slice(0, visibleCount);

        qaList.innerHTML = displayData.map(({ item, index }) => {
            let q = escapeHtml(currentLang === 'en' ? (item.q_en || item.q) : item.q);
            let a = escapeHtml(currentLang === 'en' ? (item.a_en || item.a) : item.a);

            if (searchTerm) {
                q = highlightText(q, searchTerm);
                a = highlightText(a, searchTerm);
            }

            // Check if this question has an associated video
            let videoLink = '';
            if (typeof videoData !== 'undefined') {
                const matchingVideos = videoData.filter(v => {
                    const qNum = index + 1;
                    if (v.desc.includes(`제${qNum}문`) || v.title.includes(`제${qNum}문`)) return true;
                    return false;
                });
                if (matchingVideos.length > 0) {
                    const v = matchingVideos[0];
                    const watchText = currentLang === 'en' ? i18n.en.watchEp : i18n.ko.watchEp;
                    videoLink = `
                    <div class="qa-video-link" onclick="event.stopPropagation(); openVideo('${v.videoId}', ${v.episode}, '${escapeAttr(v.title)}')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      ${v.episode}${watchText}
                    </div>`;
                }
            }

            const qPrefix = currentLang === 'en' ? 'Q' : '문';

            return `
        <div class="qa-item" data-index="${index}">
          <div class="qa-header" onclick="toggleQA(this)" role="button" tabindex="0" aria-expanded="false">
            <div class="qa-number">${index + 1}</div>
            <div class="qa-question">${qPrefix} ${index + 1}. ${q}</div>
            <div class="qa-toggle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
          <div class="qa-body">
            <div class="qa-answer">${a}${videoLink}</div>
          </div>
        </div>`;
        }).join('');

        // Handle Load More Button Visibility
        if (loadMoreContainer && loadMoreBtn) {
            if (filtered.length > visibleCount) {
                loadMoreContainer.style.display = 'block';
                const loadText = currentLang === 'en' ? i18n.en.loadMore : i18n.ko.loadMore;
                loadMoreBtn.textContent = loadText;
            } else {
                loadMoreContainer.style.display = 'none';
            }
        }

        if (searchTerm) {
            const countText = currentLang === 'en' ? i18n.en.resultCount : i18n.ko.resultCount;
            searchResultCount.textContent = `${filtered.length}${countText}`;
        } else if (currentFilter !== 'all') {
            const countText = currentLang === 'en' ? i18n.en.resultCountShort : i18n.ko.resultCountShort;
            searchResultCount.textContent = `${filtered.length}${countText}`;
        } else {
            searchResultCount.textContent = '';
        }
    }

    // ===== Set Language =====
    function setLanguage(lang) {
        if (!i18n[lang]) return;
        currentLang = lang;
        const texts = i18n[lang];

        // Update active button
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Update all data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (texts[key]) {
                // If element has HTML inside (like bold tags in about section), use innerHTML
                if (key.startsWith('aboutIntro') || key === 'heroDesc' || key.includes('Quote') || key.startsWith('book')) {
                    el.innerHTML = texts[key];
                } else {
                    el.textContent = texts[key];
                }
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if (texts[key]) {
                el.placeholder = texts[key];
            }
        });

        // Re-render Q&A
        renderQA();
    }

    // Language Switcher Events
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });

    function getFilteredData() {
        const searchTerm = currentSearch.trim().toLowerCase();
        let results = catechismData.map((item, index) => ({ item, index }));

        // Apply filter
        if (currentFilter !== 'all') {
            const [start, end] = currentFilter.split('-').map(Number);
            results = results.filter(({ index }) => index + 1 >= start && index + 1 <= end);
        }

        // Apply search
        if (searchTerm) {
            results = results.filter(({ item }) => {
                // Search in both languages if available
                const q = (item.q || '').toLowerCase();
                const a = (item.a || '').toLowerCase();
                const q_en = (item.q_en || '').toLowerCase();
                const a_en = (item.a_en || '').toLowerCase();

                return q.includes(searchTerm) || a.includes(searchTerm) ||
                    q_en.includes(searchTerm) || a_en.includes(searchTerm);
            });
        }

        // Transform items for display based on language
        return results.map(r => {
            const item = r.item;
            return {
                index: r.index,
                item: {
                    q: currentLang === 'en' ? (item.q_en || item.q) : item.q,
                    a: currentLang === 'en' ? (item.a_en || item.a) : item.a
                }
            };
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function highlightText(text, term) {
        if (!term) return text;
        const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ===== Toggle Q&A Item =====
    window.toggleQA = function (header) {
        const item = header.closest('.qa-item');
        const isExpanded = item.classList.contains('expanded');

        // Close all others
        document.querySelectorAll('.qa-item.expanded').forEach(el => {
            if (el !== item) {
                el.classList.remove('expanded');
                el.querySelector('.qa-header').setAttribute('aria-expanded', 'false');
            }
        });

        item.classList.toggle('expanded');
        header.setAttribute('aria-expanded', !isExpanded);
    };

    // ===== Search =====
    searchInput.addEventListener('input', () => {
        currentSearch = searchInput.value;
        searchClear.classList.toggle('visible', currentSearch.length > 0);
        visibleCount = 20; // Reset pagination
        renderQA();
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        currentSearch = '';
        searchClear.classList.remove('visible');
        renderQA();
        searchInput.focus();
    });

    // ===== Filters =====
    filterTags.forEach(tag => {
        tag.addEventListener('click', () => {
            filterTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            currentFilter = tag.dataset.filter;
            visibleCount = 20; // Reset pagination
            renderQA();
        });
    });

    // ===== Theme Toggle =====
    function setTheme(dark) {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        themeToggle.querySelector('.theme-icon').textContent = dark ? '☀️' : '🌙';
        localStorage.setItem('weminso-theme', dark ? 'dark' : 'light');
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        setTheme(!isDark);
    });

    // Initialize theme
    const savedTheme = localStorage.getItem('weminso-theme');
    // Default to light unless 'dark' is explicitly saved
    if (savedTheme === 'dark') {
        setTheme(true);
    } else {
        setTheme(false); // Default to light
    }


    // ===== Scroll Behaviors =====
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Navbar hide/show
        if (scrollY > lastScroll && scrollY > 100) {
            navbar.classList.add('hidden');
        } else {
            navbar.classList.remove('hidden');
        }
        lastScroll = scrollY;

        // Back to top button
        backToTop.classList.toggle('visible', scrollY > 600);
    }, { passive: true });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== Scroll Animations =====
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('animated');
                }, parseInt(delay));
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

    // ===== Keyboard support for Q&A headers =====
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('qa-header')) {
            toggleQA(e.target);
        }
    });

    // Init
    createParticles();

    // Load More Listener
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            visibleCount += 20;
            renderQA();
        });
    }
    // Video Language Tab Listeners
    videoLangTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            videoLangTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentVideoLang = tab.dataset.videoLang;
            renderVideoGrid();
        });
    });

    renderVideoGrid();
    renderQA();

    // ===== Image Modal Logic =====
    const imageModal = document.getElementById('imageModal');
    const imageModalContent = document.getElementById('imageModalContent');
    const imageModalClose = document.querySelector('.image-modal-close');

    window.openImageModal = function (src) {
        if (!imageModal || !imageModalContent) return;
        imageModalContent.src = src;
        imageModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    function closeImageModal() {
        if (!imageModal) return;
        imageModal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (imageModalContent) imageModalContent.src = '';
        }, 300);
    }

    if (imageModalClose) {
        imageModalClose.addEventListener('click', closeImageModal);
    }

    if (imageModal) {
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal || e.target === imageModalContent) {
                closeImageModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && imageModal && imageModal.classList.contains('active')) {
            closeImageModal();
        }
    });

    // Final Sync
    setLanguage(currentLang);
});
