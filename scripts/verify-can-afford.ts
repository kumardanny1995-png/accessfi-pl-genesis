import { createClient } from "@supabase/supabase-js";
import puppeteer, { type Browser, type Page } from "puppeteer-core";

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error("Missing Supabase environment variables.");
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function makeEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function clickByText(page: Page, text: string) {
  const clicked = await page.evaluate((target) => {
    const elements = Array.from(document.querySelectorAll("button, a"));
    const match = elements.find((element) => element.textContent?.trim().includes(target));
    if (match instanceof HTMLElement) {
      match.click();
      return true;
    }
    return false;
  }, text);

  if (!clicked) {
    throw new Error(`Could not click element with text: ${text}`);
  }
}

async function fillVisibleNumbers(page: Page, values: Array<number | string>) {
  await page.waitForFunction(
    (count) => document.querySelectorAll('input[type="number"]:not([disabled])').length >= count,
    { timeout: 10000 },
    values.length
  );

  const inputs = await page.$$('input[type="number"]:not([disabled])');
  if (inputs.length < values.length) {
    throw new Error(`Expected at least ${values.length} number inputs, found ${inputs.length}.`);
  }

  await page.evaluate((nextValues) => {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    const targets = Array.from(document.querySelectorAll('input[type="number"]:not([disabled])')).slice(0, nextValues.length);

    targets.forEach((input, index) => {
      if (!(input instanceof HTMLInputElement) || !valueSetter) {
        return;
      }

      valueSetter.call(input, String(nextValues[index]));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }, values.map(String));
}

async function waitForPath(page: Page, expectedPath: string, timeout = 15000) {
  await page.waitForFunction((path) => window.location.pathname === path, { timeout }, expectedPath);
}

async function waitForPathIncludes(page: Page, pathFragment: string, timeout = 15000) {
  await page.waitForFunction((fragment) => window.location.pathname.includes(fragment), { timeout }, pathFragment);
}

async function getPageState(page: Page) {
  const path = new URL(page.url()).pathname;
  const body = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 700));
  return {
    path,
    body
  };
}

async function createConfirmedUser(email: string, password: string, displayName: string) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName
    }
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Unable to create test user.");
  }

  return data.user;
}

async function queryUserData(userId: string) {
  const [profileRes, goalsRes, decisionsRes] = await Promise.all([
    adminClient.from("financial_profiles").select("*").eq("user_id", userId).maybeSingle(),
    adminClient.from("financial_goals").select("*").eq("user_id", userId),
    adminClient.from("decisions").select("*").eq("user_id", userId).order("created_at", { ascending: false })
  ]);

  if (profileRes.error) {
    throw new Error(profileRes.error.message);
  }
  if (goalsRes.error) {
    throw new Error(goalsRes.error.message);
  }
  if (decisionsRes.error) {
    throw new Error(decisionsRes.error.message);
  }

  return {
    profile: profileRes.data,
    goals: goalsRes.data ?? [],
    decisions: decisionsRes.data ?? []
  };
}

async function verifyRls(userEmail: string, password: string, foreignUserId: string, foreignDecisionId: string) {
  const userClient = createClient(supabaseUrl!, anonKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data: sessionData, error: signInError } = await userClient.auth.signInWithPassword({
    email: userEmail,
    password
  });

  if (signInError || !sessionData.session) {
    throw new Error(signInError?.message ?? "Unable to sign in as secondary user.");
  }

  const [profileRes, decisionsRes] = await Promise.all([
    userClient.from("financial_profiles").select("*").eq("user_id", foreignUserId),
    userClient.from("decisions").select("*").eq("id", foreignDecisionId)
  ]);

  if (profileRes.error) {
    throw new Error(profileRes.error.message);
  }
  if (decisionsRes.error) {
    throw new Error(decisionsRes.error.message);
  }

  return {
    foreignProfilesVisible: (profileRes.data ?? []).length,
    foreignDecisionsVisible: (decisionsRes.data ?? []).length
  };
}

async function testSignupPage(browser: Browser): Promise<CheckResult> {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const email = makeEmail("ciai-signup");
  const password = "CanIAfford123!";

  try {
    await page.goto(`${appUrl}/signup`, { waitUntil: "networkidle0" });
    await page.type('input[autocomplete="name"]', "Signup Flow");
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);
    await page.click('button[type="submit"]');

    await Promise.race([
      page.waitForFunction(() => ["/onboarding", "/dashboard"].includes(window.location.pathname), { timeout: 15000 }),
      page.waitForFunction(
        () => {
          const body = document.body.innerText.toLowerCase();
          return (
            body.includes("account created") ||
            body.includes("verify the sign-in link") ||
            body.includes("check your email") ||
            body.includes("confirm your email")
          );
        },
        { timeout: 15000 }
      )
    ]);

    const path = new URL(page.url()).pathname;
    const body = await page.evaluate(() => document.body.innerText);
    const detail =
      path === "/onboarding" || path === "/dashboard"
        ? `Signup created a session and redirected to ${path}.`
        : `Signup submitted and returned confirmation message: ${body.includes("Account created.") ? "email verification required" : "success message shown"}.`;

    return {
      name: "signup",
      ok: true,
      detail
    };
  } catch (error) {
    return {
      name: "signup",
      ok: false,
      detail:
        (error instanceof Error ? error.message : "Signup flow failed.") +
        ` Current state: ${JSON.stringify(await getPageState(page))}`
    };
  } finally {
    await context.close();
  }
}

async function testPrimaryFlow(browser: Browser, email: string, password: string) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  try {
    await page.goto(`${appUrl}/login`, { waitUntil: "networkidle0" });
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await waitForPath(page, "/onboarding");

    await fillVisibleNumbers(page, [185000, 220000]);
    await clickByText(page, "Next Step");

    await page.waitForFunction(() => document.body.innerText.includes("monthly essentials"), { timeout: 10000 });
    await fillVisibleNumbers(page, [42000, 18000, 12000]);
    await clickByText(page, "Next Step");

    await page.waitForFunction(() => document.body.innerText.includes("future safety net"), { timeout: 10000 });
    await fillVisibleNumbers(page, [280000, 18000, 22000, 24000]);
    await clickByText(page, "Next Step");

    await page.waitForFunction(() => document.body.innerText.includes("What are you saving for"), { timeout: 10000 });
    const primaryGoalInput = await page.$('input[placeholder="e.g. House deposit"]');
    const secondaryGoalInput = await page.$('input[placeholder="Optional"]');
    if (!primaryGoalInput || !secondaryGoalInput) {
      throw new Error("Goal inputs not found.");
    }
    await primaryGoalInput.type("Europe Trip");
    await secondaryGoalInput.type("Emergency Fund");
    await fillVisibleNumbers(page, [350000, 250000]);
    await clickByText(page, "Finish");

    await waitForPath(page, "/dashboard", 20000);
    await page.waitForFunction(() => document.body.innerText.includes("Recent Decisions"), { timeout: 15000 });

    await page.goto(`${appUrl}/decisions/new`, { waitUntil: "networkidle0" });
    await page.type("textarea", "Can I afford a Goa trip next month?");
    const titleInput = await page.$('input[placeholder="iPhone on EMI"]');
    if (!titleInput) {
      throw new Error("Decision title input not found.");
    }
    await titleInput.type("Goa Trip Test");
    await page.select("select", "travel");
    await fillVisibleNumbers(page, [55000]);
    await clickByText(page, "Within 3 Months");
    await clickByText(page, "Analyze My Decision");

    await waitForPathIncludes(page, "/decisions/", 20000);
    await page.waitForFunction(() => document.body.innerText.includes("Before vs After"), { timeout: 15000 });
    const resultUrl = page.url();
    const decisionId = resultUrl.split("/decisions/")[1] ?? "";
    if (!decisionId) {
      throw new Error("Decision ID not found in result URL.");
    }

    await page.goto(`${appUrl}/history`, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => document.body.innerText.includes("Goa Trip Test"), { timeout: 15000 });
    await clickByText(page, "Goa Trip Test");
    await waitForPath(page, `/decisions/${decisionId}`, 15000);
    await page.waitForFunction(() => document.body.innerText.includes("Before vs After"), { timeout: 15000 });

    await page.click('button[aria-label="Log out"]');
    await waitForPath(page, "/login", 15000);
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });

    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await waitForPath(page, "/dashboard", 15000);
    await page.goto(`${appUrl}/history`, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => document.body.innerText.includes("Goa Trip Test"), { timeout: 15000 });

    return {
      decisionId
    };
  } catch (error) {
    const state = await getPageState(page);
    throw new Error(`${error instanceof Error ? error.message : "Primary flow failed."} Current state: ${JSON.stringify(state)}`);
  } finally {
    await context.close();
  }
}

async function main() {
  const results: CheckResult[] = [];
  const userOneEmail = makeEmail("ciai-user1");
  const userTwoEmail = makeEmail("ciai-user2");
  const password = "CanIAfford123!";

  const userOne = await createConfirmedUser(userOneEmail, password, "Aarav E2E");
  const userTwo = await createConfirmedUser(userTwoEmail, password, "Mira E2E");

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    results.push(await testSignupPage(browser));

    const primaryFlow = await testPrimaryFlow(browser, userOneEmail, password);
    results.push({
      name: "login-onboarding-decision-history-persistence",
      ok: true,
      detail: `Primary flow completed and reopened decision ${primaryFlow.decisionId} after logout/login.`
    });

    const stored = await queryUserData(userOne.id);
    results.push({
      name: "supabase-persistence",
      ok: Boolean(stored.profile && stored.goals.length >= 1 && stored.decisions.some((item) => item.id === primaryFlow.decisionId)),
      detail: `Stored profile=${Boolean(stored.profile)}, goals=${stored.goals.length}, decisions=${stored.decisions.length}.`
    });

    const rls = await verifyRls(userTwoEmail, password, userOne.id, primaryFlow.decisionId);
    results.push({
      name: "rls",
      ok: rls.foreignProfilesVisible === 0 && rls.foreignDecisionsVisible === 0,
      detail: `Secondary user saw profiles=${rls.foreignProfilesVisible}, decisions=${rls.foreignDecisionsVisible}.`
    });
  } catch (error) {
    results.push({
      name: "primary-flow",
      ok: false,
      detail: error instanceof Error ? error.message : "Primary flow failed."
    });
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.ok);
  for (const result of results) {
    const prefix = result.ok ? "PASS" : "FAIL";
    console.log(`${prefix}: ${result.name} - ${result.detail}`);
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

void main();
