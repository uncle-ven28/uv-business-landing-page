// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const navMobile = document.getElementById("navMobile");

if (navToggle && navMobile) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMobile.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navMobile.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMobile.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Scroll reveal animations
const revealEls = document.querySelectorAll(".reveal, .reveal-group");

if ("IntersectionObserver" in window && revealEls.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("in-view"));
}

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Placeholder calendar (stands in for the live booking embed)
(() => {
  const root = document.getElementById("cal");
  if (!root) return;

  const label = document.getElementById("calLabel");
  const daysEl = document.getElementById("calDays");
  const slotsEl = document.getElementById("calSlots");
  const slotHead = document.getElementById("calSlotHead");
  const tzEl = document.getElementById("calTz");

  const SLOTS = ["9:00 AM", "10:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  let view = new Date(firstOfThisMonth);
  let selected = null;

  const sameDay = (a, b) =>
    a && b && a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  // Monday-first offset so the grid lines up with the Mo…Su header
  const leadingBlanks = (d) => (d.getDay() + 6) % 7;

  function renderSlots() {
    slotsEl.innerHTML = "";
    if (!selected) {
      slotHead.textContent = "Available times";
      slotsEl.innerHTML = '<li class="cal-tz">Pick a date to see open times.</li>';
      return;
    }
    slotHead.textContent = selected.toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric"
    });
    SLOTS.forEach((time, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-slot" + (i === 0 ? " is-selected" : "");
      btn.textContent = time;
      btn.addEventListener("click", () => {
        slotsEl.querySelectorAll(".cal-slot").forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
      });
      li.appendChild(btn);
      slotsEl.appendChild(li);
    });
  }

  function render() {
    label.textContent = view.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    const year = view.getFullYear();
    const month = view.getMonth();
    const total = new Date(year, month + 1, 0).getDate();

    daysEl.innerHTML = "";

    for (let i = 0; i < leadingBlanks(view); i++) {
      const blank = document.createElement("span");
      blank.className = "cal-day is-empty";
      daysEl.appendChild(blank);
    }

    for (let d = 1; d <= total; d++) {
      const date = new Date(year, month, d);
      const weekend = date.getDay() === 0 || date.getDay() === 6;
      const past = date < today;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-day";
      btn.textContent = String(d);
      btn.dataset.dow = date.toLocaleDateString(undefined, { weekday: "short" });
      btn.disabled = past || weekend;

      if (sameDay(date, today)) btn.classList.add("is-today");
      if (sameDay(date, selected)) btn.classList.add("is-selected");

      if (!btn.disabled) {
        btn.addEventListener("click", () => {
          selected = date;
          render();
          renderSlots();
        });
      }
      daysEl.appendChild(btn);
    }

    // never page back before the current month
    const prev = root.querySelector('[data-cal-step="-1"]');
    if (prev) prev.disabled = view <= firstOfThisMonth;
  }

  root.querySelectorAll("[data-cal-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = Number(btn.dataset.calStep);
      const next = new Date(view.getFullYear(), view.getMonth() + step, 1);
      if (next < firstOfThisMonth) return;
      view = next;
      render();
    });
  });

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) tzEl.textContent = "Times shown in " + tz.replace(/_/g, " ");
  } catch (e) {
    tzEl.textContent = "";
  }

  // open on the first bookable weekday so the placeholder shows a populated state
  (() => {
    const probe = new Date(today);
    for (let i = 0; i < 14; i++) {
      if (probe.getDay() !== 0 && probe.getDay() !== 6) { selected = new Date(probe); break; }
      probe.setDate(probe.getDate() + 1);
    }
    if (selected) view = new Date(selected.getFullYear(), selected.getMonth(), 1);
  })();

  render();
  renderSlots();
})();
