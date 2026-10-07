import test from "node:test";
import assert from "node:assert/strict";
import { loadOwnedTransactions, deleteOwnedTransactions, deleteAllOwnedTransactions } from "../src/lib/transactions/records.js";

function database(initialRows, { failDeleteAt = 0, throwDeleteAt = 0, failReadAt = 0 } = {}) {
  let rows = initialRows.map((row) => ({ transaction_date: "2026-10-01", ...row }));
  const requests = [];
  let deletes = 0;
  let reads = 0;
  const client = {
    from(table) {
      assert.equal(table, "transactions");
      const request = { filters: [], orders: [], deleting: false };
      const query = {
        select(columns) { request.columns = columns; return query; },
        eq(column, value) { request.filters.push([column, value]); return query; },
        in(column, values) { request.in = [column, values]; return query; },
        order(column, options) { request.orders.push([column, options]); return query; },
        range(start, end) { request.range = [start, end]; return query; },
        delete(options) { request.deleting = true; request.options = options; return query; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            requests.push(request);
            assert.ok(request.filters.some(([column, value]) => column === "user_id" && value), "Every request must be account-scoped");
            if (request.deleting) {
              deletes++;
              if (deletes === throwDeleteAt) throw new TypeError("fetch failed");
              if (deletes === failDeleteAt) return { error: { message: "Database unavailable" } };
            } else if (++reads === failReadAt) return { data: null, error: { message: "Read unavailable" } };
            const matches = rows.filter((row) => request.filters.every(([column, value]) => row[column] === value)
              && (!request.in || request.in[1].includes(String(row[request.in[0]]))));
            if (request.deleting) {
              rows = rows.filter((row) => !matches.includes(row));
              return { data: request.columns ? matches.map(({ id }) => ({ id })) : null, count: request.options?.count ? matches.length : null, error: null };
            }
            return { data: matches.slice(request.range[0], request.range[1] + 1), error: null };
          }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return { client, requests, remaining: () => rows };
}

const owned = (count) => Array.from({ length: count }, (_, index) => ({ id: String(index + 1), user_id: "account-a" }));

test("selection deletion removes only the signed-in account's selected rows and deduplicates IDs", async () => {
  const db = database([...owned(4), { id: "5", user_id: "account-b" }]);
  const result = await deleteOwnedTransactions(db.client, "account-a", [1, "1", "3", "5", "999"]);
  assert.deepEqual(result, { deletedIds: ["1", "3"], count: 2 });
  assert.deepEqual(db.remaining().map((row) => row.id), ["2", "4", "5"]);
  assert.deepEqual(db.requests[0].in[1], ["1", "3", "5", "999"]);
});

test("UUID transaction IDs are supported", async () => {
  const id = "09ec35b0-b5f6-4d07-9256-97a26f667730";
  const db = database([{ id, user_id: "account-a" }]);
  assert.deepEqual(await deleteOwnedTransactions(db.client, "account-a", [id]), { deletedIds: [id], count: 1 });
});

test("missing authentication and invalid selections never issue database requests", async () => {
  const db = database(owned(2));
  await assert.rejects(deleteAllOwnedTransactions(db.client, null), /sign in/);
  await assert.rejects(deleteOwnedTransactions(db.client, null, ["1"]), /sign in/);
  await assert.rejects(loadOwnedTransactions(db.client, null), /sign in/);
  for (const ids of [null, [], ["1", null], ["1", "all"], ["1", "2),user_id.neq.x"], [{}], [1.5], [Number.MAX_SAFE_INTEGER + 1], Array(10001).fill("1")]) {
    await assert.rejects(deleteOwnedTransactions(db.client, "account-a", ids));
  }
  assert.equal(db.requests.length, 0);
  assert.equal(db.remaining().length, 2);
});

test("large selected deletions use bounded requests without dropping rows", async () => {
  const db = database(owned(251));
  const result = await deleteOwnedTransactions(db.client, "account-a", owned(251).map((row) => row.id));
  assert.equal(result.count, 251);
  assert.deepEqual(db.requests.map((request) => request.in[1].length), [100, 100, 51]);
  assert.equal(db.remaining().length, 0);
});

test("a failed later batch reports completed deletions and a retry removes only the remainder", async () => {
  for (const failure of [{ failDeleteAt: 2 }, { throwDeleteAt: 2 }]) {
    const db = database(owned(251), failure);
    const result = await deleteOwnedTransactions(db.client, "account-a", owned(251).map((row) => row.id));
    assert.equal(result.count, 100);
    assert.match(result.error, /could not finish/);
    assert.equal(db.requests.length, 2);
    assert.equal(db.remaining().length, 151);
    const retry = await deleteOwnedTransactions(db.client, "account-a", owned(251).map((row) => row.id));
    assert.equal(retry.count, 151);
    assert.equal(db.remaining().length, 0);
  }
});

test("delete all covers more than 1,000 records in one request and preserves other accounts", async () => {
  const db = database([...owned(2501), { id: "3000", user_id: "account-b" }]);
  const result = await deleteAllOwnedTransactions(db.client, "account-a");
  assert.deepEqual(result, { count: 2501 });
  assert.equal(db.requests.length, 1);
  assert.equal(db.requests[0].in, undefined);
  assert.equal(db.requests[0].columns, undefined);
  assert.equal(db.requests[0].options.count, "exact");
  assert.deepEqual(db.remaining().map((row) => row.user_id), ["account-b"]);
  assert.deepEqual(await deleteAllOwnedTransactions(db.client, "account-a"), { count: 0 });
});

test("delete-all failures never claim success", async () => {
  for (const failure of [{ failDeleteAt: 1 }, { throwDeleteAt: 1 }]) {
    const db = database(owned(3), failure);
    const result = await deleteAllOwnedTransactions(db.client, "account-a");
    assert.equal(result.count, null);
    assert.match(result.error, /Could not confirm/);
    assert.equal(db.remaining().length, 3);
  }
});

test("the ledger reads all pages and fails instead of showing incomplete history", async () => {
  const db = database([...owned(2501), { id: "3000", user_id: "account-b" }]);
  const rows = await loadOwnedTransactions(db.client, "account-a");
  assert.equal(rows.length, 2501);
  assert.deepEqual(db.requests.map((request) => request.range), [[0, 999], [1000, 1999], [2000, 2999]]);
  assert.ok(db.requests.every((request) => request.orders[1][0] === "id"));
  const failing = database(owned(2501), { failReadAt: 2 });
  await assert.rejects(loadOwnedTransactions(failing.client, "account-a"), /could not be loaded/);
});
