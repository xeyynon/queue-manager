import { expect, test, type Page } from "@playwright/test";

// Any console error or uncaught exception fails the test (hydration mismatches included).
let consoleErrors: string[] = [];
test.beforeEach(({ page }) => {
  consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
});
test.afterEach(() => {
  // The wrong-password test expects one 401 from the auth endpoint; network 4xx are not app errors.
  expect(consoleErrors.filter((t) => !/Failed to load resource: the server responded with a status of 4\d\d/.test(t))).toEqual([]);
});

// One fresh manager per test, so tests never depend on each other's data.
async function signUp(page: Page) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await page.goto("/login");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Your name").fill("Asha Test");
  await page.getByLabel("Email").fill(`e2e-${id}@test.local`);
  await page.getByLabel("Password").fill("correct-horse-42");
  await page.locator("form").getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/queues$/);
}

async function createQueue(page: Page, name: string) {
  await page.getByLabel("Queue name").fill(name);
  await page.getByRole("button", { name: "Create queue" }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

async function addTokens(page: Page, labels: string[]) {
  for (const l of labels) {
    await page.getByLabel(/Name or note/).fill(l);
    await page.getByRole("button", { name: /Add token/ }).click();
    await expect(page.getByTestId("waiting-row").filter({ hasText: l })).toBeVisible();
  }
}

const rowNumbers = (page: Page) => page.getByTestId("waiting-row").locator(".ticket").allTextContents();

test("signed-out visitors are sent to the login page", async ({ page }) => {
  await page.goto("/queues");
  await expect(page).toHaveURL(/\/login/);
});

test("wrong password shows a clear error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@test.local");
  await page.getByLabel("Password").fill("wrong-password");
  await page.locator("form").getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("main form").getByRole("alert")).toContainText("don't match");
});

test("full queue flow: create, add, reorder, serve, cancel + undo, dashboard", async ({ page }) => {
  await signUp(page);
  await expect(page.getByText("No queues yet")).toBeVisible();

  // R1/R2: create a named queue
  await createQueue(page, "General OPD");
  await expect(page.getByText("No one’s waiting")).toBeVisible();

  // R3/R4: add tokens; they appear in order
  await addTokens(page, ["Ravi", "Meena", "Arjun"]);
  expect(await rowNumbers(page)).toEqual(["#1", "#2", "#3"]);

  // R5: move #3 up, then #1 down
  await page.getByRole("button", { name: "Move #3 up" }).click();
  await expect.poll(() => rowNumbers(page)).toEqual(["#1", "#3", "#2"]);
  await expect(page.getByTestId("waiting-row").filter({ hasText: "Arjun" })).toContainText("moved up");
  await page.getByRole("button", { name: "Move #1 down" }).click();
  await expect.poll(() => rowNumbers(page)).toEqual(["#3", "#1", "#2"]);

  // Edge: first-up and last-down are disabled, not errors
  await expect(page.getByRole("button", { name: "Move #3 up" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Move #2 down" })).toBeDisabled();

  // R6: serve the top token with one click; a double-click must serve only one
  await page.getByRole("button", { name: /Serve next/ }).dblclick();
  await expect(page.getByRole("region", { name: "Now serving" })).toContainText("#3");
  // The panel updates optimistically; the toast appears only once the server confirmed.
  await expect(page.getByText(/^Now serving #3 · Arjun$/)).toBeVisible();
  await page.reload();
  expect(await rowNumbers(page)).toEqual(["#1", "#2"]);

  // R7: cancel with undo
  await page.getByRole("button", { name: "Cancel #2" }).click();
  await expect.poll(() => rowNumbers(page)).toEqual(["#1"]);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => rowNumbers(page)).toEqual(["#1", "#2"]);

  // Audit log lists the actions
  const log = page.getByRole("region", { name: "Activity" });
  await expect(log).toContainText("moved up");
  await expect(log).toContainText("put back (undo)");

  // Serve everyone, then the button says why it's disabled
  await page.getByRole("button", { name: /Serve next #1/ }).click();
  await expect(page.getByRole("region", { name: "Now serving" })).toContainText("#1");
  await expect(page.getByText(/^Now serving #1 · Ravi$/)).toBeVisible(); // server confirmed
  await page.getByRole("button", { name: /Serve next #2/ }).click();
  await expect(page.getByRole("button", { name: "Serve next" })).toBeDisabled();
  await expect(page.getByText("No one is waiting.")).toBeVisible();
  await expect(page.getByText(/^Now serving #2 · Meena$/)).toBeVisible(); // server confirmed

  // R8: dashboard reflects the activity
  await page.getByRole("link", { name: "Dashboard" }).click();
  const figures = page.getByRole("region", { name: "Key figures" });
  await expect(figures).toContainText("Served");
  await expect(figures.getByText("3", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Queue length" })).toBeVisible();
  await page.getByRole("button", { name: "Last 7 days" }).click();
  await expect(page).toHaveURL(/range=7d/);
});

test("keyboard shortcuts: A adds, S serves, ? opens help", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard shortcuts are a desktop feature");
  await signUp(page);
  await createQueue(page, "Keys");
  await page.locator("body").click({ position: { x: 5, y: 300 } });
  await page.keyboard.press("a");
  await expect(page.getByTestId("waiting-row")).toHaveCount(1);
  await page.keyboard.press("a");
  await expect(page.getByTestId("waiting-row")).toHaveCount(2);
  await page.keyboard.press("s");
  await expect(page.getByRole("region", { name: "Now serving" })).toContainText("#1");
  await page.keyboard.press("?");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("double-clicking Add token issues one token, not two", async ({ page }) => {
  await signUp(page);
  await createQueue(page, "Guard");
  await page.getByRole("button", { name: /Add token/ }).dblclick();
  await expect(page.getByTestId("waiting-row")).toHaveCount(1);
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByTestId("waiting-row")).toHaveCount(1);
});

test("duplicate queue names are rejected with a message", async ({ page }) => {
  await signUp(page);
  await createQueue(page, "Billing");
  await page.goto("/queues");
  await page.getByLabel("Queue name").fill("billing");
  await page.getByRole("button", { name: "Create queue" }).click();
  await expect(page.locator("main form").getByRole("alert")).toContainText("already have a queue");
});

test("another manager's queue is not reachable", async ({ page, browser }) => {
  await signUp(page);
  await createQueue(page, "Private");
  const url = page.url();
  const other = await browser.newPage();
  await signUp(other);
  await other.goto(url);
  await expect(other.getByRole("heading", { name: "Not found" })).toBeVisible();
  await other.close();
});
