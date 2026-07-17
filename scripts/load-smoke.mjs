const baseUrl = process.env.LOAD_TEST_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const paths = ["/", "/search", "/live", "/api/health"];
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY || 4);
const iterations = Number(process.env.LOAD_TEST_ITERATIONS || 5);
const failures = [];

async function hit(path) {
  const started = Date.now();
  const response = await fetch(new URL(path, baseUrl), { cache: "no-store" });
  const elapsed = Date.now() - started;
  if (!response.ok) failures.push(`${path} returned ${response.status}`);
  if (elapsed > 2000) failures.push(`${path} took ${elapsed}ms`);
}

for (let round = 0; round < iterations; round += 1) {
  await Promise.all(Array.from({ length: concurrency }, (_, index) => hit(paths[index % paths.length])));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Load smoke check passed for ${baseUrl}.`);
