// js/translator.js
// Google Translate Integration & Language Switcher (English <-> Bangla)

function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    {
      pageLanguage: "bn",
      includedLanguages: "en,bn",
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false,
    },
    "google_translate_element"
  );

  // Periodically verify and update active button visual state
  setTimeout(syncLanguageUI, 600);
  setTimeout(syncLanguageUI, 1500);
}

// Function to switch between 'en' and 'bn'
function setTranslateLang(lang) {
  const cookieVal = `/bn/${lang}`;
  const hostname = window.location.hostname;

  // Set cookies for Google Translate across paths and domains
  document.cookie = `googtrans=${cookieVal}; path=/`;
  if (hostname && hostname !== "localhost") {
    document.cookie = `googtrans=${cookieVal}; domain=${hostname}; path=/`;
  }

  // Find Google Translate select element and trigger change
  const select = document.querySelector(".goog-te-combo");
  if (select) {
    select.value = lang;
    select.dispatchEvent(new Event("change"));
  } else {
    // If widget not initialized yet, reload to let cookie take effect
    window.location.reload();
  }

  updateLanguageButtons(lang);
}

// Update UI buttons based on active language
function updateLanguageButtons(currentLang) {
  const bnBtns = document.querySelectorAll(".btn-lang-bn");
  const enBtns = document.querySelectorAll(".btn-lang-en");

  if (currentLang === "en") {
    enBtns.forEach((btn) => {
      btn.classList.add("bg-white", "text-indigo-900", "shadow-xs");
      btn.classList.remove("text-indigo-700");
    });
    bnBtns.forEach((btn) => {
      btn.classList.remove("bg-white", "text-indigo-900", "shadow-xs");
      btn.classList.add("text-indigo-700");
    });
  } else {
    bnBtns.forEach((btn) => {
      btn.classList.add("bg-white", "text-indigo-900", "shadow-xs");
      btn.classList.remove("text-indigo-700");
    });
    enBtns.forEach((btn) => {
      btn.classList.remove("bg-white", "text-indigo-900", "shadow-xs");
      btn.classList.add("text-indigo-700");
    });
  }
}

// Sync button UI on initial load
function syncLanguageUI() {
  let activeLang = "bn";
  const match = document.cookie.match(/googtrans=\/bn\/([a-z]+)/);
  if (match && match[1]) {
    activeLang = match[1];
  } else {
    const select = document.querySelector(".goog-te-combo");
    if (select && select.value) {
      activeLang = select.value;
    }
  }
  updateLanguageButtons(activeLang);
}

document.addEventListener("DOMContentLoaded", () => {
  syncLanguageUI();
});
