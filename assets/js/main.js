const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");

if (navToggle && navMenu) {
  const closeMenu = () => {
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Άνοιγμα πλοήγησης");
    navMenu.classList.remove("is-open");
  };

  navToggle.addEventListener("click", () => {
    const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isExpanded));
    navToggle.setAttribute("aria-label", isExpanded ? "Άνοιγμα πλοήγησης" : "Κλείσιμο πλοήγησης");
    navMenu.classList.toggle("is-open", !isExpanded);
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 960) {
        closeMenu();
      }
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 960) {
      closeMenu();
    }
  });
}

const popRevealSelectors = [
  "main > section",
  ".hero-grid > div",
  ".page-hero-grid > div",
  ".split-layout > div",
  ".about-preview > div",
  ".contact-layout > div",
  ".hero-copy",
  ".hero-highlights",
  ".hero-card",
  ".hero-note",
  ".info-panel",
  ".content-card",
  ".feature-card",
  ".service-card",
  ".reason-card",
  ".timeline-item",
  ".sidebar-card",
  ".contact-panel",
  ".service-item",
  ".stacked-copy",
  ".section-heading",
  ".about-preview-copy",
  ".portrait-placeholder",
  ".map-placeholder",
  ".cta-panel",
  ".feature-grid > *",
  ".reasons-grid > *",
  ".cards-grid > *",
  ".content-grid > *",
  ".timeline > *",
  ".service-list > *",
  ".contact-sidebar > *",
  ".footer-grid > div",
];

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const popRevealElements = [...new Set(popRevealSelectors.flatMap((selector) => [...document.querySelectorAll(selector)]))];
const siteHeader = document.querySelector(".site-header");
const backgroundSlides = [...document.querySelectorAll(".about-page-background-slide")];
let revealSyncFrame = null;

const isElementInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const triggerOffset = Math.min(viewportHeight * 0.12, 96);

  return rect.bottom > triggerOffset && rect.top < viewportHeight - triggerOffset;
};

const restartCssAnimation = (element) => {
  if (!element) {
    return;
  }

  element.style.animation = "none";
  void element.offsetWidth;
  element.style.animation = "";
};

const replayVisibleRevealAnimations = () => {
  if (!popRevealElements.length || reducedMotionQuery.matches) {
    return;
  }

  popRevealElements.forEach((element) => {
    element.classList.remove("is-visible");
  });

  requestAnimationFrame(() => {
    popRevealElements.forEach((element) => {
      if (isElementInViewport(element)) {
        element.classList.add("is-visible");
      }
    });
  });
};

const replayBackgroundAnimations = () => {
  if (!backgroundSlides.length || reducedMotionQuery.matches) {
    return;
  }

  backgroundSlides.forEach((slide) => {
    slide.classList.remove("is-pop-entering", "is-slide-entering");
  });

  requestAnimationFrame(() => {
    backgroundSlides.forEach((slide, index) => {
      if (slide.classList.contains("is-active") && index === 0) {
        slide.classList.add("is-pop-entering");
      }
    });
  });
};

const replayPageAnimations = () => {
  if (reducedMotionQuery.matches) {
    return;
  }

  restartCssAnimation(siteHeader);
  replayVisibleRevealAnimations();
  replayBackgroundAnimations();
  queueRevealSync();
};

const syncRevealVisibility = () => {
  if (!popRevealElements.length || reducedMotionQuery.matches) {
    return;
  }

  popRevealElements.forEach((element) => {
    element.classList.toggle("is-visible", isElementInViewport(element));
  });
};

const queueRevealSync = () => {
  if (revealSyncFrame !== null) {
    return;
  }

  revealSyncFrame = requestAnimationFrame(() => {
    revealSyncFrame = null;
    syncRevealVisibility();
  });
};

if (popRevealElements.length) {
  if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
    popRevealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  } else {
    popRevealElements.forEach((element, index) => {
      element.classList.add("pop-reveal");
      element.style.setProperty("--pop-delay", `${Math.min(index * 60, 420)}ms`);
    });

    const popRevealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -4% 0px",
      }
    );

    popRevealElements.forEach((element) => {
      popRevealObserver.observe(element);
    });
  }
}

queueRevealSync();
window.addEventListener("load", replayPageAnimations);
window.addEventListener("pageshow", replayPageAnimations);
window.addEventListener("resize", queueRevealSync, { passive: true });
window.addEventListener("scroll", queueRevealSync, { passive: true });

const backgroundCarousels = document.querySelectorAll("[data-background-carousel]");

backgroundCarousels.forEach((carousel) => {
  const slides = [...carousel.querySelectorAll(".about-page-background-slide")];
  let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
  let autoRotateTimer = null;
  let transitionCleanupTimer = null;
  let isTransitioning = false;

  if (!slides.length) {
    return;
  }

  if (activeIndex < 0) {
    activeIndex = 0;
    slides[0].classList.add("is-active");
  }

  const renderCarousel = (nextIndex) => {
    if (isTransitioning) {
      return;
    }

    const previousIndex = activeIndex;
    activeIndex = (nextIndex + slides.length) % slides.length;
    isTransitioning = true;

    slides.forEach((slide, index) => {
      slide.classList.remove("is-pop-entering", "is-slide-entering", "is-slide-leaving");
      slide.classList.toggle("is-active", index === activeIndex || index === previousIndex);
    });

    if (transitionCleanupTimer) {
      window.clearTimeout(transitionCleanupTimer);
    }

    requestAnimationFrame(() => {
      const previousSlide = slides[previousIndex];
      const activeSlide = slides[activeIndex];
      if (previousSlide && previousSlide !== activeSlide) {
        previousSlide.classList.add("is-slide-leaving");
      }
      activeSlide.classList.add("is-slide-entering");
    });

    transitionCleanupTimer = window.setTimeout(() => {
      slides.forEach((slide, index) => {
        slide.classList.remove("is-slide-entering", "is-slide-leaving");
        slide.classList.toggle("is-active", index === activeIndex);
      });
      isTransitioning = false;
      queueNextRotate();
    }, 1160);
  };

  const queueNextRotate = () => {
    if (autoRotateTimer) {
      window.clearTimeout(autoRotateTimer);
    }

    autoRotateTimer = window.setTimeout(() => {
      renderCarousel(activeIndex + 1);
    }, 4500);
  };

  queueNextRotate();
});
