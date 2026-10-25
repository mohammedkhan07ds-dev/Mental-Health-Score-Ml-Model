(() => {
  "use strict";

  // Backend address. Start the API with:
  //   uvicorn main:app --reload --port 8000
  const API_BASE = "https://mental-health-score-ml-model-kmk8.onrender.com/";

  // Same list main.py uses to group countries. Anything else becomes "Other" on the server.
  const TOP_COUNTRIES = ["India", "USA", "Canada", "Australia", "UK", "Germany", "Mexico", "Turkey", "France"];

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isStacked = window.matchMedia("(max-width: 920px)");

  const form = document.getElementById("predict-form");
  const submitBtn = document.getElementById("submit-btn");
  const resetBtn = document.getElementById("reset-btn");
  const errorRetryBtn = document.getElementById("error-retry-btn");
  const formAlert = document.getElementById("form-alert");

  const resultPanel = document.getElementById("result-panel");
  const stateIdle = document.getElementById("state-idle");
  const stateLoading = document.getElementById("state-loading");
  const stateResult = document.getElementById("state-result");
  const stateError = document.getElementById("state-error");

  const scoreNumberEl = document.getElementById("score-number");
  const scoreBandEl = document.getElementById("score-band");
  const scoreContextEl = document.getElementById("score-context");
  const gaugeFill = document.getElementById("gauge-fill");
  const gaugeKnob = document.getElementById("gauge-knob");
  const scaleItems = document.querySelectorAll("#scale li");
  const errorLabelEl = document.getElementById("error-label");
  const errorCopyEl = document.getElementById("error-copy");

  const apiStatus = document.getElementById("api-status");
  const apiStatusText = document.getElementById("api-status-text");

  const GAUGE_ARC_LENGTH = gaugeFill && gaugeFill.getTotalLength ? gaugeFill.getTotalLength() : 314;

  // ---------------------------------------------------------
  // Footer year
  // ---------------------------------------------------------
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---------------------------------------------------------
  // Mobile navigation
  // ---------------------------------------------------------
  const nav = document.getElementById("site-nav");
  const navToggle = document.getElementById("nav-toggle");

  function setNav(open) {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  }
  navToggle.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setNav(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setNav(false);
      navToggle.focus();
    }
  });

  // ---------------------------------------------------------
  // Gauge tick marks (0..10, every 2 units)
  // ---------------------------------------------------------
  function drawTicks() {
    document.querySelectorAll(".gauge-ticks").forEach((g) => {
      g.innerHTML = "";
      const cx = 120, cy = 140, rOuter = 88, rInner = 79;
      for (let i = 0; i <= 10; i += 2) {
        const angle = Math.PI - (i / 10) * Math.PI;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", (cx + rOuter * Math.cos(angle)).toFixed(1));
        line.setAttribute("y1", (cy - rOuter * Math.sin(angle)).toFixed(1));
        line.setAttribute("x2", (cx + rInner * Math.cos(angle)).toFixed(1));
        line.setAttribute("y2", (cy - rInner * Math.sin(angle)).toFixed(1));
        g.appendChild(line);
      }
    });
  }
  drawTicks();

  // ---------------------------------------------------------
  // Sliders: each range input mirrors a number input.
  // The number input stays the source of truth (it has the name/id).
  // ---------------------------------------------------------
  function setSliderFill(slider) {
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const pct = ((parseFloat(slider.value) - min) / (max - min)) * 100;
    slider.style.setProperty("--fill", `${Math.max(0, Math.min(100, pct))}%`);
  }

  const sliders = Array.from(form.querySelectorAll("input.slider"));
  sliders.forEach((slider) => {
    const numberInput = document.getElementById(slider.dataset.sync);
    if (!numberInput) return;

    setSliderFill(slider);

    slider.addEventListener("input", () => {
      numberInput.value = slider.value;
      setSliderFill(slider);
      clearFieldError(slider.dataset.sync);
    });

    numberInput.addEventListener("input", () => {
      const v = parseFloat(numberInput.value);
      slider.value = Number.isNaN(v) ? "0" : String(Math.max(0, Math.min(parseFloat(slider.max), v)));
      setSliderFill(slider);
    });
  });

  // ---------------------------------------------------------
  // Field-level error helpers (fields are found by data-field)
  // ---------------------------------------------------------
  function fieldEl(name) {
    return form.querySelector(`.field[data-field="${name}"]`);
  }

  function setFieldError(name, message) {
    const wrap = fieldEl(name);
    if (!wrap) return false;
    wrap.classList.add("field-error");
    const msgEl = wrap.querySelector(".error-msg");
    if (msgEl) msgEl.textContent = message;
    return true;
  }

  function clearFieldError(name) {
    const wrap = fieldEl(name);
    if (!wrap) return;
    wrap.classList.remove("field-error");
    const msgEl = wrap.querySelector(".error-msg");
    if (msgEl) msgEl.textContent = "";
  }

  function clearAllErrors() {
    form.querySelectorAll(".field").forEach((f) => f.classList.remove("field-error"));
    form.querySelectorAll(".error-msg").forEach((m) => (m.textContent = ""));
    formAlert.hidden = true;
    formAlert.textContent = "";
  }

  function showFormAlert(text) {
    formAlert.textContent = text;
    formAlert.hidden = false;
  }

  function focusField(name) {
    const wrap = fieldEl(name);
    if (!wrap) return;
    const target = wrap.querySelector("input:checked") || wrap.querySelector("input:not([type=range]), select");
    if (target) target.focus();
  }

  // ---------------------------------------------------------
  // Client-side validation mirroring the StudentData model in main.py
  // ---------------------------------------------------------
  const NUMERIC_RULES = [
    // [field, min, max, integerOnly]
    ["age", 10, 100, true],
    ["avg_daily_usage_hours", 0, 24, false],
    ["daily_unlocks", 0, Infinity, true],
    ["study_hours", 0, 24, false],
    ["physical_activity_hours", 0, 24, false],
    ["sleep_hours_per_night", 0, 24, false],
  ];

  function validate(payload) {
    const errors = [];

    NUMERIC_RULES.forEach(([key, min, max, integerOnly]) => {
      const val = payload[key];
      if (Number.isNaN(val)) {
        errors.push([key, "This field is required."]);
      } else if (integerOnly && !Number.isInteger(val)) {
        errors.push([key, "Enter a whole number."]);
      } else if (val < min || val > max) {
        errors.push([key, `Must be between ${min} and ${max === Infinity ? "0 or more" : max}.`]);
      }
    });

    ["gender", "country", "academic_level", "most_used_platform", "purpose_of_use"].forEach((key) => {
      if (!payload[key] || String(payload[key]).trim() === "") {
        errors.push([key, key === "country" || key === "most_used_platform" ? "This field is required." : "Pick one option."]);
      }
    });

    if (!payload.stress_level) errors.push(["stress_level", "Pick a stress level."]);

    return errors;
  }

  // ---------------------------------------------------------
  // Gather form data into the exact StudentData shape
  // ---------------------------------------------------------
  function canonicalCountry(raw) {
    const trimmed = (raw || "").trim();
    const match = TOP_COUNTRIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
    return match || trimmed;
  }

  function collectPayload() {
    const fd = new FormData(form);
    const num = (key) => {
      const v = fd.get(key);
      return v === null || String(v).trim() === "" ? NaN : Number(v);
    };
    return {
      age: num("age"),
      gender: fd.get("gender") || "",
      country: canonicalCountry(fd.get("country")),
      academic_level: fd.get("academic_level") || "",
      most_used_platform: fd.get("most_used_platform") || "",
      purpose_of_use: fd.get("purpose_of_use") || "",
      avg_daily_usage_hours: num("avg_daily_usage_hours"),
      daily_unlocks: num("daily_unlocks"),
      study_hours: num("study_hours"),
      physical_activity_hours: num("physical_activity_hours"),
      sleep_hours_per_night: num("sleep_hours_per_night"),
      stress_level: fd.get("stress_level") || "",
    };
  }

  // ---------------------------------------------------------
  // UI state switching
  // ---------------------------------------------------------
  function showState(name) {
    [stateIdle, stateLoading, stateResult, stateError].forEach((el) => (el.hidden = true));
    ({ idle: stateIdle, loading: stateLoading, result: stateResult, error: stateError }[name]).hidden = false;
    if (name !== "result") delete resultPanel.dataset.band;
  }

  function setSubmitting(isSubmitting) {
    submitBtn.disabled = isSubmitting;
    submitBtn.classList.toggle("loading", isSubmitting);
    submitBtn.setAttribute("aria-busy", String(isSubmitting));
  }

  function scrollToResult() {
    if (!isStacked.matches) return;
    resultPanel.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth", block: "start" });
  }

  function bandFor(score) {
    if (score < 4) {
      return {
        key: "strained",
        label: "Signal: strained",
        context: "Your responses suggest elevated strain right now. Small shifts in sleep or screen time can go a long way.",
      };
    }
    if (score < 7) {
      return {
        key: "balanced",
        label: "Signal: balanced",
        context: "Your rhythm looks fairly steady, with some room to recover and reset.",
      };
    }
    return {
      key: "strong",
      label: "Signal: strong",
      context: "Your habits point to a well-supported, resilient baseline. Keep it up.",
    };
  }

  function renderResult(score) {
    const clamped = Math.max(0, Math.min(10, score));
    const { key, label, context } = bandFor(clamped);

    scoreNumberEl.textContent = score.toFixed(2);
    scoreBandEl.textContent = label;
    scoreContextEl.textContent = context;
    scaleItems.forEach((li) => li.classList.toggle("active", li.dataset.band === key));

    showState("result");
    resultPanel.dataset.band = key;

    // Reset the gauge, then animate to the new value on the next frame.
    gaugeFill.style.transition = "none";
    gaugeKnob.style.transition = "none";
    gaugeFill.style.strokeDashoffset = String(GAUGE_ARC_LENGTH);
    gaugeKnob.style.transform = "rotate(0deg)";
    void gaugeFill.getBoundingClientRect();
    requestAnimationFrame(() => {
      gaugeFill.style.transition = "";
      gaugeKnob.style.transition = "";
      gaugeFill.style.strokeDashoffset = String(GAUGE_ARC_LENGTH * (1 - clamped / 10));
      gaugeKnob.style.transform = `rotate(${(clamped / 10) * 180}deg)`;
    });
  }

  function renderError(label, copy) {
    errorLabelEl.textContent = label;
    errorCopyEl.textContent = copy;
    showState("error");
  }

  // ---------------------------------------------------------
  // API status pill (uses the existing GET / route)
  // ---------------------------------------------------------
  function setApiStatus(state) {
    apiStatus.dataset.state = state;
    apiStatusText.textContent = { checking: "Checking API…", online: "API connected", offline: "API offline" }[state];
  }

  async function checkApi() {
    setApiStatus("checking");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`${API_BASE}/`, { signal: controller.signal });
      setApiStatus(res.ok ? "online" : "offline");
    } catch (_) {
      setApiStatus("offline");
    } finally {
      clearTimeout(timer);
    }
  }
  apiStatus.addEventListener("click", checkApi);
  checkApi();

  // ---------------------------------------------------------
  // Parse FastAPI / Pydantic 422 responses into field-level messages
  // ---------------------------------------------------------
  function applyServerValidationErrors(detail) {
    if (!Array.isArray(detail)) return false;
    let matched = false;
    detail.forEach((err) => {
      const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : null;
      if (field && setFieldError(field, err.msg || "Invalid value.")) matched = true;
    });
    return matched;
  }

  // ---------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAllErrors();

    const payload = collectPayload();
    const clientErrors = validate(payload);

    if (clientErrors.length > 0) {
      clientErrors.forEach(([name, msg]) => setFieldError(name, msg));
      showFormAlert(
        clientErrors.length === 1
          ? "One field needs attention. It is marked below."
          : `${clientErrors.length} fields need attention. They are marked below.`
      );
      focusField(clientErrors[0][0]);
      return;
    }

    setSubmitting(true);
    showState("loading");
    scrollToResult();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      setApiStatus("online");

      if (res.status === 422) {
        const body = await res.json().catch(() => null);
        const matched = body && applyServerValidationErrors(body.detail);
        if (matched) showFormAlert("The API rejected a few fields. They are marked on the form.");
        renderError(
          "Check your inputs",
          matched
            ? "The API rejected a few fields. Details are marked on the form."
            : "The API rejected this submission. Please review your inputs and try again."
        );
        return;
      }

      if (!res.ok) {
        let detailMsg = `The API responded with status ${res.status}.`;
        const body = await res.json().catch(() => null);
        if (body && typeof body.detail === "string") detailMsg = body.detail;
        renderError("Prediction failed", detailMsg);
        return;
      }

      const data = await res.json();
      if (typeof data.predicted_mental_health_score !== "number") {
        renderError("Unexpected response", "The API responded, but the score was missing or malformed.");
        return;
      }

      renderResult(data.predicted_mental_health_score);
    } catch (err) {
      setApiStatus("offline");
      renderError(
        err && err.name === "AbortError" ? "The request timed out" : "Can't reach the server",
        `Couldn't get a response from ${API_BASE}. Make sure the backend is running (uvicorn main:app --reload --port 8000) and try again.`
      );
    } finally {
      clearTimeout(timer);
      setSubmitting(false);
    }
  });

  // ---------------------------------------------------------
  // Clear errors as the user edits; keep sliders in sync on reset
  // ---------------------------------------------------------
  form.querySelectorAll(".field").forEach((wrap) => {
    const name = wrap.dataset.field;
    wrap.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("input", () => clearFieldError(name));
      el.addEventListener("change", () => clearFieldError(name));
    });
  });

  form.addEventListener("reset", () => {
    clearAllErrors();
    // Wait for the browser to restore default values, then re-sync the visuals.
    setTimeout(() => sliders.forEach((s) => setSliderFill(s)), 0);
    showState("idle");
  });

  resetBtn.addEventListener("click", () => {
    showState("idle");
    if (isStacked.matches) {
      document.getElementById("predict").scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
    }
  });

  errorRetryBtn.addEventListener("click", () => {
    showState("idle");
    checkApi();
  });
})();
