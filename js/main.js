(function () {
  "use strict";

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  /* Уведомления */
  var toast = $(".toast");
  var toastTimer;

  function showToast(message) {
    if (!toast) { return; }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 3400);
  }

  $$("[data-toast]").forEach(function (el) {
    el.addEventListener("click", function () { showToast(el.getAttribute("data-toast")); });
  });

  /* Мобильное меню */
  var burger = $("[data-burger]");
  var nav = $("#site-nav");

  if (burger && nav) {
    burger.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(isOpen));
      burger.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Открыть меню");
        burger.focus();
      }
    });
  }

  /* Корзина (демо-режим: только счётчик) */
  var CART_KEY = "touch-cart-count";
  var badge = $("[data-cart-badge]");
  var cartButton = $("[data-cart-open]");

  function readCart() {
    try { return parseInt(window.localStorage.getItem(CART_KEY), 10) || 0; } catch (e) { return 0; }
  }

  function writeCart(value) {
    try { window.localStorage.setItem(CART_KEY, String(value)); } catch (e) { /* хранилище недоступно */ }
  }

  function renderCart(count) {
    if (badge) {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    }
    if (cartButton) {
      cartButton.setAttribute("aria-label", "Корзина, товаров: " + count);
    }
  }

  renderCart(readCart());

  $$("[data-add-to-cart]").forEach(function (button) {
    button.addEventListener("click", function () {
      var count = readCart() + 1;
      writeCart(count);
      renderCart(count);
      showToast("Товар добавлен в корзину. Всего товаров: " + count);
    });
  });

  if (cartButton) {
    cartButton.addEventListener("click", function () {
      var count = readCart();
      showToast(count
        ? "В корзине товаров: " + count + ". Оформление заказа появится в следующей версии сайта."
        : "Корзина пуста. Оформление заказа появится в следующей версии сайта.");
    });
  }

  /* Каталог: поиск, фильтры, сортировка */
  var grid = $("[data-catalog-grid]");
  var filtersForm = $("[data-filters]");

  if (grid && filtersForm) {
    var items = $$(".catalog__item", grid);
    var status = $("[data-catalog-status]");
    var empty = $("[data-catalog-empty]");
    var more = $("[data-catalog-more]");
    var params = new URLSearchParams(window.location.search);
    var categoryNames = { "new": "Новинки 2026", bags: "Сумки и рюкзаки", hoodies: "Толстовки и худи", trousers: "Брюки" };
    var category = categoryNames[params.get("cat")] ? params.get("cat") : "";

    var applyFilters = function () {
      var query = filtersForm.elements.q.value.trim().toLowerCase();
      var color = filtersForm.elements.color.value;
      var gender = filtersForm.elements.gender.value;
      var season = filtersForm.elements.season.value;
      var order = filtersForm.elements.price.value;

      var visible = items.filter(function (item) {
        var d = item.dataset;
        var haystack = (d.title + " " + d.keywords).toLowerCase();
        return (!query || haystack.indexOf(query) !== -1) &&
          (color === "all" || d.color === color) &&
          (gender === "any" || d.gender === gender || d.gender === "unisex") &&
          (season === "any" || d.season === season || d.season === "all") &&
          (!category || d.tags.split(" ").indexOf(category) !== -1);
      });

      visible.sort(function (a, b) {
        if (order === "default") { return items.indexOf(a) - items.indexOf(b); }
        var diff = Number(a.dataset.price) - Number(b.dataset.price);
        return order === "desc" ? -diff : diff;
      });

      items.forEach(function (item) { item.hidden = true; });
      visible.forEach(function (item) {
        item.hidden = false;
        grid.appendChild(item);
      });

      empty.hidden = visible.length !== 0;
      var text = "Найдено товаров: " + visible.length;
      if (category) { text += ". Раздел: " + categoryNames[category]; }
      status.textContent = text;
    };

    filtersForm.addEventListener("submit", function (event) {
      event.preventDefault();
      applyFilters();
    });

    filtersForm.addEventListener("reset", function () {
      window.setTimeout(function () {
        category = "";
        applyFilters();
      }, 0);
    });

    if (more) {
      more.addEventListener("click", function () {
        more.textContent = "Это все товары коллекции";
        more.setAttribute("aria-disabled", "true");
        showToast("Показаны все товары коллекции 2026.");
      });
    }

    applyFilters();
  }

  /* Галерея на странице товара */
  var gallery = $("[data-gallery]");

  if (gallery) {
    var mainImage = $("[data-gallery-main]", gallery);
    var thumbs = $$("[data-gallery-thumb]", gallery);
    var current = 0;

    var showImage = function (index) {
      current = (index + thumbs.length) % thumbs.length;
      var thumb = thumbs[current];
      mainImage.src = thumb.getAttribute("data-src");
      mainImage.alt = thumb.getAttribute("data-alt");
      thumbs.forEach(function (t, i) { t.setAttribute("aria-current", i === current ? "true" : "false"); });
    };

    thumbs.forEach(function (thumb, index) {
      thumb.addEventListener("click", function () { showImage(index); });
    });

    var prev = $("[data-gallery-prev]", gallery);
    var next = $("[data-gallery-next]", gallery);
    if (prev) { prev.addEventListener("click", function () { showImage(current - 1); }); }
    if (next) { next.addEventListener("click", function () { showImage(current + 1); }); }
  }

  /* Отзывы: показать следующие */
  var moreReviews = $("[data-reviews-more]");

  if (moreReviews) {
    moreReviews.addEventListener("click", function () {
      var hiddenList = $("[data-reviews-hidden]");
      if (hiddenList) { hiddenList.hidden = false; }
      moreReviews.hidden = true;
    });
  }

  /* Формы: проверка полей */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function checkField(control) {
    var rules = (control.getAttribute("data-validate") || "").split(" ");
    var value = control.type === "checkbox" ? control.checked : control.value.trim();
    var message = "";

    rules.forEach(function (rule) {
      if (message) { return; }
      if (rule === "required" && !value) { message = control.getAttribute("data-msg-required"); }
      else if (rule === "email" && value && !EMAIL_RE.test(value)) { message = control.getAttribute("data-msg-email"); }
      else if (rule.indexOf("min:") === 0 && value && value.length < Number(rule.slice(4))) { message = control.getAttribute("data-msg-min"); }
    });

    var wrapper = control.closest(".field, .checkbox");
    var error = document.getElementById(control.getAttribute("aria-describedby"));
    var invalid = Boolean(message);

    control.setAttribute("aria-invalid", String(invalid));
    wrapper.classList.toggle(wrapper.classList.contains("checkbox") || wrapper.hasAttribute("data-checkbox") ? "checkbox--error" : "field--error", invalid);
    if (error) {
      error.textContent = message;
      error.hidden = !invalid;
    }
    return !invalid;
  }

  $$("form[data-form]").forEach(function (form) {
    var controls = $$("[data-validate]", form);

    controls.forEach(function (control) {
      control.addEventListener("blur", function () { checkField(control); });
      control.addEventListener("input", function () {
        if (control.getAttribute("aria-invalid") === "true") { checkField(control); }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var firstInvalid = null;

      controls.forEach(function (control) {
        if (!checkField(control) && !firstInvalid) { firstInvalid = control; }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      showToast(form.getAttribute("data-success"));
      var redirect = form.getAttribute("data-redirect");
      if (redirect) {
        window.setTimeout(function () { window.location.href = redirect; }, 1200);
      } else {
        form.reset();
      }
    });
  });
})();
