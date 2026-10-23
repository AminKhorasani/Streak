import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays, calendarWeeks, currentStreak, dateFromKey, dateKey, intensityLevel,
  isGoalMet, persianParts, persianYearDates, startOfPersianYear,
  validateData, initialData
} from "./core.js";

test("Nowruz 1405 and Persian year length align", () => {
  const nowruz = startOfPersianYear(1405);
  assert.equal(dateKey(nowruz), "2026-03-21");
  assert.deepEqual(persianParts(nowruz), { year: 1405, month: 1, day: 1 });
  assert.ok([365, 366].includes(persianYearDates(1405).length));
});
test("Every calendar column contains Saturday-first seven rows", () => {
  const weeks = calendarWeeks(1405);
  assert.equal(weeks[0].length, 7);
  assert.equal(weeks.flat().filter(Boolean).length, persianYearDates(1405).length);
  const first = weeks.flat().find(Boolean);
  assert.equal(dateKey(first), "2026-03-21");
});
test("Negative behavior zero is success; missing log is not success", () => {
  const h = { kind: "negative", target: 0 };
  assert.equal(isGoalMet(h, 0), true);
  assert.equal(isGoalMet(h, 1), false);
  assert.equal(isGoalMet(h, undefined), false);
});
test("Positive behavior meets threshold", () => {
  const h = { kind: "positive", target: 10 };
  assert.equal(isGoalMet(h, 9), false);
  assert.equal(isGoalMet(h, 10), true);
});
test("Scaled intensity distinguishes one cigarette from twenty", () => {
  assert.equal(intensityLevel(1, [1, 20]), 1);
  assert.equal(intensityLevel(20, [1, 20]), 4);
  assert.equal(intensityLevel(0, [1, 20]), 0);
});
test("Streak allows today to be unlogged, but never rewards missing history", () => {
  const today = new Date(2026, 9, 24, 12);
  const h = { kind: "negative", target: 0 };
  const logs = {
    [dateKey(addDays(today, -1))]: 0,
    [dateKey(addDays(today, -2))]: 0
  };
  assert.equal(currentStreak(h, logs, today), 2);
  logs[dateKey(today)] = 1;
  assert.equal(currentStreak(h, logs, today), 0);
});
test("Date parser rejects invalid dates", () => {
  assert.equal(dateFromKey("2026-02-30"), null);
  assert.equal(dateFromKey("evil"), null);
});
test("Backup validation keeps zero values but rejects invalid data", () => {
  const state = initialData();
  state.logs.smoking = { "2026-10-24": 0 };
  assert.equal(validateData(state).logs.smoking["2026-10-24"], 0);
  assert.throws(() => validateData({ ...state, logs: { smoking: { "2026-10-24": -1 } } }));
});
