// The booking sheet and the /book/ page with JavaScript: one step at a time, live slots on the
// Vancouver clock, the provider from src/data/booking.ts, and the confirmation with an .ics file.
import type { ClientStrings } from "../i18n";
import { bookingConfig } from "../data/booking";
import { parseBookQuery, type BookParams, type Make, type Service } from "../lib/book";
import { createProvider, type BookingRequest } from "../lib/booking";
import { formatTime } from "../lib/hours";
import { buildIcs } from "../lib/ics";
import { bookableDays, zonedToUtc } from "../lib/slots";

const HOUR = 3_600_000;
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

export const booking = (strings: ClientStrings) => {
  const flow = document.querySelector<HTMLElement>("[data-book-flow]");
  if (!flow) return;
  const form = flow.querySelector<HTMLFormElement>("[data-book-form]")!;
  const steps = [...form.querySelectorAll<HTMLFieldSetElement>("[data-step]")];
  const sheet = flow.closest<HTMLDialogElement>("[data-book-sheet]");
  const done = flow.querySelector<HTMLElement>("[data-book-done]")!;
  const ics = flow.querySelector<HTMLAnchorElement>("[data-ics]")!;
  const error = form.querySelector<HTMLElement>("[data-book-error]")!;
  const daysBox = form.querySelector<HTMLElement>("[data-days]")!;
  const timesBox = form.querySelector<HTMLElement>("[data-times]")!;
  const provider = createProvider(bookingConfig);
  const { lang } = strings;
  const { hours, timeZone } = strings.shop;
  let current = 0;
  let days = bookableDays(new Date(), hours, timeZone);

  // JavaScript validates step by step; the no-JavaScript date and time fields drop out of the form.
  form.noValidate = true;
  form.querySelector<HTMLFieldSetElement>("[data-nojs]")!.disabled = true;

  const dayLabel = (date: string, weekday: "short" | "long") =>
    new Intl.DateTimeFormat(lang, { weekday, month: weekday, day: "numeric", timeZone: "UTC" }).format(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)));

  const choice = (name: string, value: string, text: string) => {
    const label = document.createElement("label");
    const input = Object.assign(document.createElement("input"), { type: "radio", name, value, required: true });
    const span = Object.assign(document.createElement("span"), { textContent: text });
    label.className = "choice";
    label.append(input, span);
    return label;
  };
  const renderTimes = (date: string) => {
    const day = days.find((d) => d.date === date);
    timesBox.replaceChildren(...(day?.times ?? []).map((tm) => choice("time", tm, formatTime(tm, lang))));
  };
  const renderDays = () => {
    days = bookableDays(new Date(), hours, timeZone);
    daysBox.replaceChildren(...days.map((d) => choice("date", d.date, dayLabel(d.date, "short"))));
    timesBox.replaceChildren();
  };
  daysBox.addEventListener("change", (e) => renderTimes((e.target as HTMLInputElement).value));

  const isValid = (i: number) => [...steps[i].querySelectorAll<HTMLInputElement>("input, select, textarea")].every((el) => el.disabled || el.checkValidity());
  const report = (i: number) => [...steps[i].querySelectorAll<HTMLInputElement>("input, select, textarea")].find((el) => !el.disabled && !el.checkValidity())?.reportValidity();
  const show = (i: number, focus = true) => {
    current = i;
    steps.forEach((s, j) => (s.hidden = j !== i));
    form.querySelector("[data-book-progress]")!.textContent = fill(strings.book.step, { n: i + 1, total: steps.length });
    if (focus) (steps[i].querySelector<HTMLElement>("input:checked") ?? steps[i].querySelector<HTMLElement>("input, select, textarea"))?.focus();
  };
  const next = () => {
    if (!isValid(current)) return report(current);
    show(current + 1);
  };

  const prefill = (p: BookParams, model?: string) => {
    form.reset();
    delete flow.dataset.done;
    error.hidden = true;
    if (ics.href) URL.revokeObjectURL(ics.href);
    ics.removeAttribute("href");
    ics.removeAttribute("download");
    renderDays();
    for (const [name, value] of [["make", p.make], ["service", p.service]] as const) {
      const radio = value && form.querySelector<HTMLInputElement>(`input[name=${name}][value="${value}"]`);
      if (radio) radio.checked = true;
    }
    form.querySelector<HTMLInputElement>("[name=model]")!.value = model ?? p.model?.toUpperCase() ?? "";
    return !p.make ? 0 : !p.service ? 1 : 2;
  };

  const checkedLabel = (name: string) => form.querySelector(`input[name=${name}]:checked`)?.closest("label")?.textContent?.trim() ?? "";
  const confirm = (req: BookingRequest, reference: string) => {
    const out = (k: string, v: string) => (done.querySelector(`[data-out=${k}]`)!.textContent = v);
    const service = checkedLabel("service");
    out("reference", reference);
    out("car", [checkedLabel("make"), req.model].filter(Boolean).join(" · "));
    out("service", service);
    out("when", `${dayLabel(req.date, "long")} · ${formatTime(req.time, lang)}`);
    const start = zonedToUtc(req.date, req.time, timeZone);
    const file = buildIcs({
      uid: `${reference}-${req.date}@feinwerk-auto.demo`,
      start,
      end: new Date(start.getTime() + HOUR),
      stamp: new Date(),
      summary: fill(strings.book.ics, { service, name: strings.book.name }),
      location: strings.book.address,
      description: strings.book.sent,
    });
    ics.href = URL.createObjectURL(new Blob([file], { type: "text/calendar" }));
    ics.download = "feinwerk-auto-booking.ics";
    flow.dataset.done = "";
    done.focus();
  };

  form.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest("button");
    if (btn?.hasAttribute("data-next")) next();
    else if (btn?.hasAttribute("data-back")) show(current - 1);
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (current < steps.length - 1) return next();
    const bad = steps.findIndex((_, i) => !isValid(i));
    if (bad >= 0) {
      show(bad, false);
      return report(bad);
    }
    const d = new FormData(form);
    const text = (k: string) => String(d.get(k) ?? "").trim();
    const req: BookingRequest = {
      make: text("make") as Make,
      model: text("model"),
      service: text("service") as Service,
      notes: text("notes"),
      date: text("date"),
      time: text("time"),
      name: text("name"),
      phone: text("phone"),
      email: text("email"),
      reminders: d.get("reminders") === "yes",
      lang,
    };
    try {
      const r = await provider.submit(req);
      if (r.status !== "handoff") confirm(req, r.reference);
    } catch (err) {
      console.error("booking failed", err);
      error.hidden = false;
    }
  });

  if (!sheet) {
    // /book/ itself: start where the query string leaves off, without moving focus on load.
    show(prefill(parseBookQuery(location.search)), false);
    return;
  }

  sheet.querySelector("[data-close]")!.addEventListener("click", () => sheet.close());
  const bookPath = sheet.dataset.bookPath;
  // A Book link to this language's /book/ opens the sheet instead; a new-tab click still navigates.
  document.addEventListener("click", (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!a || a.pathname !== bookPath || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || provider.kind !== "sheet") return;
    e.preventDefault();
    const start = prefill(parseBookQuery(a.search), a.querySelector(".vh")?.textContent?.replace(/^:\s*/, ""));
    sheet.showModal();
    show(start);
  });
};
