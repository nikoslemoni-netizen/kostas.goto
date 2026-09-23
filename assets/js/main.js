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

const revealElements = document.querySelectorAll(".reveal");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      // Elements that come into view together appear one after another.
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, index) => {
          const delay = Math.min(index, 5) * 130;
          entry.target.style.setProperty("--reveal-delay", `${delay}ms`);
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
          // Drop the delay afterwards so hover transitions stay instant.
          window.setTimeout(() => entry.target.style.removeProperty("--reveal-delay"), delay + 1000);
        });
    },
    { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

const siteHeader = document.querySelector(".site-header");
const mobileCallBar = document.querySelector(".mobile-call-bar");

if (siteHeader) {
  let lastScrollY = window.scrollY;
  let ticking = false;

  const updateHeader = () => {
    const currentScrollY = window.scrollY;
    const menuOpen = navMenu && navMenu.classList.contains("is-open");
    const delta = currentScrollY - lastScrollY;

    if (currentScrollY < 80 || menuOpen) {
      siteHeader.classList.remove("is-hidden");
    } else if (delta > 6) {
      siteHeader.classList.add("is-hidden");
    } else if (delta < -6) {
      siteHeader.classList.remove("is-hidden");
    }

    // The mobile call bar does the opposite of the header: visible on the way down.
    if (mobileCallBar) {
      mobileCallBar.classList.toggle("is-visible", siteHeader.classList.contains("is-hidden"));
    }

    if (Math.abs(delta) > 6 || currentScrollY < 80) {
      lastScrollY = currentScrollY;
    }
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    },
    { passive: true }
  );

  // Keyboard users tabbing into the header should always see it.
  siteHeader.addEventListener("focusin", () => siteHeader.classList.remove("is-hidden"));
}

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

const contactForm = document.querySelector(".contact-form");

if (contactForm) {
  const successMessage = contactForm.querySelector(".form-status--success");
  const errorMessage = contactForm.querySelector(".form-status--error");
  const submitButton = contactForm.querySelector('[type="submit"]');

  const showStatus = (element) => {
    [successMessage, errorMessage].forEach((message) => {
      message.hidden = message !== element;
    });
  };

  const buildMailtoLink = (data) => {
    const body = [
      `Ονοματεπώνυμο: ${data.get("name")}`,
      `Τηλέφωνο: ${data.get("phone")}`,
      `Email: ${data.get("email")}`,
      `Προτιμώμενος τρόπος επικοινωνίας: ${data.get("preferred_contact")}`,
      "",
      data.get("message"),
    ].join("\n");

    return `mailto:${contactForm.dataset.fallbackEmail}?subject=${encodeURIComponent("Αίτημα επικοινωνίας")}&body=${encodeURIComponent(body)}`;
  };

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    let firstInvalid = null;
    contactForm.querySelectorAll("input, select, textarea").forEach((field) => {
      const isValid = field.checkValidity();
      field.setAttribute("aria-invalid", String(!isValid));
      if (!isValid && !firstInvalid) {
        firstInvalid = field;
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const data = new FormData(contactForm);
    const endpoint = contactForm.dataset.endpoint;

    // Χωρίς ρυθμισμένο endpoint, το αίτημα ανοίγει ως email στο πρόγραμμα αλληλογραφίας του επισκέπτη.
    if (!endpoint) {
      window.location.href = buildMailtoLink(data);
      return;
    }

    submitButton.disabled = true;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      contactForm.reset();
      showStatus(successMessage);
    } catch (error) {
      showStatus(errorMessage);
    } finally {
      submitButton.disabled = false;
    }
  });
}
