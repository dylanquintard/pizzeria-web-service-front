const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { app } = require("../server");

async function withServer(run) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("health endpoint stays available", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/healthz`);
    assert.equal(response.status, 200);
    const json = await response.json();
    assert.equal(json.ok, true);
  });
});

test("front server sends baseline security headers", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/healthz`);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.equal(
      response.headers.get("permissions-policy"),
      "geolocation=(), microphone=(), camera=()"
    );
    assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
  });
});

test("sitemap endpoint stays available with local fallback", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/sitemap.xml`);
    assert.equal(response.status, 200);
    assert.match(String(response.headers.get("content-type") || ""), /application\/xml/i);
    const xml = await response.text();
    assert.match(xml, /<urlset/i);
    assert.match(xml, /<loc>.*<\/loc>/i);
  });
});

test("robots endpoint points to backend sitemap source", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/robots.txt`);
    assert.equal(response.status, 200);
    assert.match(String(response.headers.get("content-type") || ""), /text\/plain/i);
    const content = await response.text();
    assert.match(content, /Sitemap:\s+https:\/\/api-alban\.eazytoolz\.site\/sitemap\.xml/i);
  });
});
