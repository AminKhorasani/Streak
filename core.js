const datePartsFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
  year: "numeric", month: "numeric", day: "numeric"
});

export const MONTHS_FA = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

export function persianParts(date) {
  const parts = Object.fromEntries(
    datePartsFormatter.formatToParts(date)
      .filter((part) => ["year", "month", "day"].includes(part.type))
      .map((part) => [part.type, Number(part.value)])
  );
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function dateKey(date) {
  const pad = (number) => String(number).padStart(2, "0");
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-");
}

export function dateFromKey(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key))) return null;
  const [year, month, day] = key.split("-").map(Number);
  const parsed = new Date(year, month - 1, day, 12);
  if (Number.isNaN(parsed.getTime()) || dateKey(parsed) !== key) return null;
  return parsed;
}

export function addDays(date, count) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  next.setDate(next.getDate() + count);
  return next;
}

export function startOfPersianYear(year) {
  if (!Number.isInteger(year) || year < 1200 || year > 1600) {
    throw new Error("Invalid Persian year.");
  }
  const gregorianYear = year + 621;
  for (let day = 15; day <= 27; day += 1) {
    const date = new Date(gregorianYear, 2, day, 12);
    const p = persianParts(date);
    if (p.year === year && p.month === 1 && p.day === 1) return date;
  }
  throw new Error("Unable to locate Persian new year.");
}

export function persianYearDates(year) {
  const dates = [];
  const first = startOfPersianYear(year);
  const following = dateKey(startOfPersianYear(year + 1));
  for (let date = first; dateKey(date) !== following; date = addDays(date, 1)) {
    dates.push(date);
    if (dates.length > 366) throw new Error("Persian year length overflow.");
  }
  return dates;
}

export function calendarWeeks(year) {
  const dates = persianYearDates(year);
  const offset = (dates[0].getDay() + 1) % 7; // Saturday is row zero.
  const cells = [...Array(offset).fill(null), ...dates];
  const weeks = [];
  for (let index = 0; index < cells.length; index += 7) {
    const week = cells.slice(index, index + 7);
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

export function intensityLevel(value, values) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const max = Math.max(value, ...values.filter((v) => Number.isFinite(v) && v > 0));
  return Math.max(1, Math.min(4, Math.ceil((value / max) * 4)));
}

export function isGoalMet(habit, value) {
  if (value === undefined || value === null || !Number.isFinite(value) || value < 0) return false;
  const target = Number(habit.target) || 0;
  return habit.kind === "negative" ? value <= target : value >= Math.max(target, 0.000001);
}

export function currentStreak(habit, logs, today = new Date()) {
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  if (!Object.hasOwn(logs, dateKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (streak < 10000 && isGoalMet(habit, logs[dateKey(cursor)])) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function yearSummary(habit, logs, year) {
  const days = persianYearDates(year);
  const recorded = days.filter((day) => Object.hasOwn(logs, dateKey(day)));
  const passed = recorded.filter((day) => isGoalMet(habit, logs[dateKey(day)]));
  const total = recorded.reduce((sum, day) => sum + logs[dateKey(day)], 0);
  return {
    recordedDays: recorded.length,
    successfulDays: passed.length,
    successRate: recorded.length ? Math.round((passed.length / recorded.length) * 100) : 0,
    total
  };
}

export const STARTER_HABITS = [
  { id: "smoking", title: "سیگار نکشیدن", icon: "🚭", unit: "نخ", kind: "negative", target: 0 },
  { id: "reading", title: "کتاب خواندن", icon: "📚", unit: "صفحه", kind: "positive", target: 10 },
  { id: "pushups", title: "شنای سوئدی", icon: "💪", unit: "عدد", kind: "positive", target: 20 },
  { id: "running", title: "دویدن", icon: "🏃", unit: "کیلومتر", kind: "positive", target: 3 }
];

export function initialData() {
  return {
    version: 1,
    habits: STARTER_HABITS.map((item) => ({ ...item })),
    logs: {},
    createdAt: new Date().toISOString()
  };
}

export function validateData(candidate) {
  if (!candidate || typeof candidate !== "object" || candidate.version !== 1 ||
      !Array.isArray(candidate.habits) || !candidate.logs ||
      typeof candidate.logs !== "object" || Array.isArray(candidate.logs)) {
    throw new Error("ساختار فایل پشتیبان معتبر نیست.");
  }
  if (candidate.habits.length > 200) throw new Error("تعداد عادت‌ها بیش از حد مجاز است.");
  const seen = new Set();
  const habits = candidate.habits.map((habit) => {
    if (!habit || typeof habit !== "object" || typeof habit.id !== "string" ||
        habit.id.length > 100 || !habit.id || seen.has(habit.id) ||
        typeof habit.title !== "string" || !habit.title.trim() ||
        habit.title.length > 80 || typeof habit.unit !== "string" || habit.unit.length > 30 ||
        !["positive", "negative"].includes(habit.kind) ||
        !Number.isFinite(habit.target) || habit.target < 0 || habit.target > 1e9) {
      throw new Error("یکی از عادت‌ها در فایل پشتیبان نامعتبر است.");
    }
    seen.add(habit.id);
    return {
      id: habit.id, title: habit.title.trim(), unit: habit.unit.trim(),
      kind: habit.kind, target: habit.target,
      icon: typeof habit.icon === "string" ? habit.icon.slice(0, 12) : "✨"
    };
  });
  const logs = {};
  let count = 0;
  for (const habit of habits) {
    const entries = candidate.logs[habit.id] || {};
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
      throw new Error("داده‌های روزانه معتبر نیستند.");
    }
    logs[habit.id] = {};
    for (const [key, value] of Object.entries(entries)) {
      if (!dateFromKey(key) || !Number.isFinite(value) || value < 0 || value > 1e9) {
        throw new Error("تاریخ یا مقدار ثبت‌شده نامعتبر است.");
      }
      logs[habit.id][key] = value;
      count += 1;
      if (count > 200000) throw new Error("فایل پشتیبان بیش از حد بزرگ است.");
    }
  }
  return { version: 1, habits, logs, createdAt: String(candidate.createdAt || "") };
}
