import test from "node:test";
import assert from "node:assert/strict";
import { buildSampleTaxModel, createSampleTaxYears } from "../src/components/marketing/sample-tax-model.js";

test("historical demo years keep their own salary inputs and tax rules", () => {
  const profiles = createSampleTaxYears();
  const current = buildSampleTaxModel("2026-27", profiles["2026-27"]);
  const previous = buildSampleTaxModel("2024-25", profiles["2024-25"]);
  assert.equal(current.tax.old.tax, 27980);
  assert.equal(current.tax.new.tax, 0);
  assert.equal(current.tax.recommended, "new");
  assert.equal(previous.tax.old.tax, 15910);
  assert.equal(previous.tax.new.tax, 27560);
  assert.equal(previous.tax.recommended, "old");
  profiles["2026-27"].annualSalary = "1500000";
  profiles["2026-27"].proofs.rent = true;
  assert.equal(profiles["2024-25"].annualSalary, "840000");
  assert.equal(profiles["2024-25"].proofs.rent, false);
  assert.equal(createSampleTaxYears()["2026-27"].annualSalary, "960000");
});

test("rent and capped deductions change salary tax without affecting the other regime", () => {
  const profile = createSampleTaxYears()["2026-27"];
  const normal = buildSampleTaxModel("2026-27", profile);
  const revised = buildSampleTaxModel("2026-27", { ...profile, monthlyRent: "10000", section80c: "250000" });
  assert.equal(revised.tax.old.deductions.hra, 72000);
  assert.equal(revised.tax.old.deductions.section80c, 150000);
  assert.ok(revised.tax.old.tax > normal.tax.old.tax);
  assert.equal(revised.tax.new.tax, normal.tax.new.tax);
});

test("blank, negative, excessive and inconsistent salaries do not show a zero-tax result", () => {
  const profile = createSampleTaxYears()["2026-27"];
  for (const changes of [{ annualSalary: "" }, { annualSalary: "-1" }, { annualSalary: "10000001" }, { annualSalary: "600000" }, { section80c: "-500" }]) {
    const model = buildSampleTaxModel("2026-27", { ...profile, ...changes });
    assert.equal(model.available, false);
    assert.equal(model.tax, null);
    assert.equal(model.selectedTax, null);
    assert.ok(Object.keys(model.errors).length > 0);
  }
});

test("filing preparation requires an explicit regime and valid TDS", () => {
  const profile = createSampleTaxYears()["2026-27"];
  assert.equal(buildSampleTaxModel("2026-27", profile).selectedTax, null);
  const old = buildSampleTaxModel("2026-27", { ...profile, regime: "old", annualTds: "10000" });
  assert.equal(old.outstanding, 17980);
  assert.equal(old.surplus, 0);
  const next = buildSampleTaxModel("2026-27", { ...profile, regime: "new" });
  assert.equal(next.outstanding, 0);
  assert.equal(next.surplus, 40000);
  for (const annualTds of ["", "-1"]) {
    const incomplete = buildSampleTaxModel("2026-27", { ...profile, regime: "new", annualTds });
    assert.equal(incomplete.available, true);
    assert.equal(incomplete.selectedTax, null);
    assert.equal(incomplete.surplus, null);
    assert.ok(incomplete.errors.annualTds);
  }
});
