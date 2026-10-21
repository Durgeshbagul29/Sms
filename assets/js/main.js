// SafeGuard SMS — single page application behaviour
(function () {
  "use strict";

  // Mobile nav toggle & body scroll lock
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  var overlay = document.querySelector("#nav-overlay");
  var body = document.body;

  function closeMenu() {
    if (links) links.classList.remove("open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    body.classList.remove("menu-open");
  }

  function openMenu() {
    if (links) links.classList.add("open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    body.classList.add("menu-open");
  }

  if (toggle && links) {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = links.classList.contains("open");
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        closeMenu();
      });
    });

    if (overlay) {
      overlay.addEventListener("click", function () {
        closeMenu();
      });
    }

    document.addEventListener("click", function (e) {
      if (links.classList.contains("open") && !links.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) {
        closeMenu();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 980 && links.classList.contains("open")) {
        closeMenu();
      }
    });
  }

  // FAQ accordion
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var isOpen = item.getAttribute("data-open") === "true";
      item.setAttribute("data-open", isOpen ? "false" : "true");
      btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });
  });

  // Scroll reveal
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("in");
    });
  }

  // Demo/contact form submission is now handled by assets/js/sms-contact-sheet.js,
  // which wires #demo-form to the shared Google Sheet endpoint.

  // Single-Page ScrollSpy & Back-to-Top — Optimized with cached metrics & rAF (zero forced reflow)
  var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  var sections = document.querySelectorAll('section[id]');
  var backToTopBtn = document.querySelector(".back-to-top");
  var sectionBounds = [];
  var isScrollTicking = false;
  var cachedDocHeight = 0;
  var cachedWinHeight = window.innerHeight;

  function measureLayout() {
    cachedWinHeight = window.innerHeight || 800;
    cachedDocHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
    var headerOffset = 110;
    sectionBounds = [];
    sections.forEach(function (sec) {
      var top = sec.offsetTop - headerOffset;
      var height = sec.offsetHeight;
      var id = sec.getAttribute("id");
      sectionBounds.push({
        id: id,
        top: top,
        bottom: top + height
      });
    });
  }

  function handleScrollTick() {
    var scrollPos = window.scrollY || window.pageYOffset || 0;
    var currentSectionId = "";

    // Back to top visibility
    if (backToTopBtn) {
      if (scrollPos > 400) {
        backToTopBtn.classList.add("visible");
      } else {
        backToTopBtn.classList.remove("visible");
      }
    }

    // ScrollSpy active state
    if (sectionBounds.length > 0) {
      if ((cachedWinHeight + scrollPos) >= cachedDocHeight - 60) {
        currentSectionId = sectionBounds[sectionBounds.length - 1].id;
      } else {
        for (var i = 0; i < sectionBounds.length; i++) {
          var b = sectionBounds[i];
          if (scrollPos >= b.top && scrollPos < b.bottom) {
            currentSectionId = b.id;
            break;
          }
        }
      }
    }

    if (currentSectionId) {
      navAnchors.forEach(function (a) {
        var href = a.getAttribute("href");
        if (href === "#" + currentSectionId) {
          if (!a.classList.contains("active")) {
            a.setAttribute("aria-current", "page");
            a.classList.add("active");
          }
        } else {
          if (a.classList.contains("active")) {
            a.removeAttribute("aria-current");
            a.classList.remove("active");
          }
        }
      });
    }

    isScrollTicking = false;
  }

  function requestScrollTick() {
    if (!isScrollTicking) {
      isScrollTicking = true;
      requestAnimationFrame(handleScrollTick);
    }
  }

  if (sections.length && navAnchors.length) {
    measureLayout();
    window.addEventListener("scroll", requestScrollTick, { passive: true });
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        measureLayout();
        requestScrollTick();
      }, 150);
    }, { passive: true });
    requestScrollTick();
  }

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Mobile Gallery Slider Controls — Cached card width & rAF-throttled dot updates
  var sliderContainer = document.querySelector(".gallery-grid.mobile-slider");
  var prevBtn = document.querySelector(".slider-arrow.prev");
  var nextBtn = document.querySelector(".slider-arrow.next");
  var dots = document.querySelectorAll(".slider-dots .dot");

  if (sliderContainer) {
    var cachedCardWidth = 260;

    function measureCardWidth() {
      var card = sliderContainer.querySelector(".gallery-item");
      if (card) {
        cachedCardWidth = card.offsetWidth + 24;
      }
    }

    measureCardWidth();
    window.addEventListener("resize", function () {
      measureCardWidth();
    }, { passive: true });

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        sliderContainer.scrollBy({ left: -cachedCardWidth, behavior: "smooth" });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        sliderContainer.scrollBy({ left: cachedCardWidth, behavior: "smooth" });
      });
    }

    var isSliderTicking = false;
    function updateDots() {
      var scrollLeft = sliderContainer.scrollLeft;
      var activeIndex = Math.round(scrollLeft / (cachedCardWidth || 1));

      dots.forEach(function (dot, idx) {
        if (idx === activeIndex) {
          dot.classList.add("active");
          dot.setAttribute("aria-current", "true");
        } else {
          dot.classList.remove("active");
          dot.removeAttribute("aria-current");
        }
      });
      isSliderTicking = false;
    }

    sliderContainer.addEventListener("scroll", function () {
      if (!isSliderTicking) {
        isSliderTicking = true;
        requestAnimationFrame(updateDots);
      }
    }, { passive: true });

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var index = parseInt(dot.getAttribute("data-index"), 10);
        if (!isNaN(index)) {
          sliderContainer.scrollTo({
            left: index * cachedCardWidth,
            behavior: "smooth"
          });
        }
      });
    });
  }

  // Web Portal Tab Switcher with Accessible ARIA Management
  window.switchPortalTab = function (tabId) {
    var contentItems = document.querySelectorAll(".portal-tab-content");
    var tabBtns = document.querySelectorAll(".portal-tab-nav .btn-tab");

    contentItems.forEach(function (item) {
      if (item.id === tabId) {
        item.style.display = "block";
        item.setAttribute("aria-hidden", "false");
      } else {
        item.style.display = "none";
        item.setAttribute("aria-hidden", "true");
      }
    });

    tabBtns.forEach(function (btn) {
      if (btn.getAttribute("data-tab") === tabId) {
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        btn.setAttribute("tabindex", "0");
      } else {
        btn.classList.remove("active");
        btn.setAttribute("aria-selected", "false");
        btn.setAttribute("tabindex", "-1");
      }
    });
  };

})();

