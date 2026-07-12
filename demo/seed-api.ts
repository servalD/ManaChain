/**
 * Peuple les entités "REST-only" de la démo (users, brand applications, images IPFS,
 * brouillons d'événements) à partir de `contracts/config/demo-seed.json`.
 *
 * Deux phases, car les événements ont besoin d'adresses on-chain déployées ENTRE les deux :
 *   pre  : users, candidatures de marque (approuvées), lien wallet<->compte, images, brouillons d'événement.
 *   post : après le script forge SeedDemo.s.sol, lie les contrats à chaque événement et publie.
 *
 * Orchestration attendue : seed-api.ts pre  →  forge script SeedDemo.s.sol  →  seed-api.ts post
 * (voir demo/run-demo-seed.sh). Le backend doit tourner avec SKIP_EMAIL_VERIFICATION=true et
 * BOOTSTRAP_ADMIN_EMAIL alignés sur `admin.bootstrapEmail` de demo-seed.json.
 *
 * Usage : npx tsx demo/seed-api.ts pre|post
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { privateKeyToAddress } from 'viem/accounts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const DEMO_SEED_PATH = join(REPO_ROOT, 'contracts/config/demo-seed.json');
const OUTPUT_PATH = join(REPO_ROOT, 'contracts/config/demo-seed.output.json');
const API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3001/api';

interface DemoSeed {
  admin: {
    bootstrapEmail: string;
    bootstrapUsername: string;
    bootstrapFirstName: string;
    bootstrapLastName: string;
    bootstrapPassword: string;
    bootstrapAgeRange: string;
  };
  brandCount: number;
  brands: BrandSeed[];
  clientCount: number;
  clients: ClientSeed[];
}

interface BrandSeed {
  privateKeyEnv: string;
  application: {
    brandName: string;
    description: string;
    interestLabels: string[];
    contactEmail: string;
    contactFirstName: string;
    contactLastName: string;
    contactPhone?: string;
    websiteUrl?: string;
    businessRegistrationNumber: string;
    country: string;
    headquartersStreet: string;
    headquartersCity: string;
    headquartersZipCode: string;
  };
  logoImagePath: string;
  mediaImagePaths: string[];
  eventCount: number;
  events: { title: string; imagePath: string; startTime: number; endTime: number; freeEvent: boolean }[];
}

interface ClientSeed {
  privateKeyEnv: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  ageRange: string;
}

function loadDemoSeed(): DemoSeed {
  return JSON.parse(readFileSync(DEMO_SEED_PATH, 'utf-8'));
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name} (see demo/.env.example)`);
  return value;
}

function readOutput(): Record<string, string> {
  if (!existsSync(OUTPUT_PATH)) return {};
  return JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
}

function writeOutput(patch: Record<string, string>): void {
  const merged = { ...readOutput(), ...patch };
  writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2) + '\n');
}

async function apiFetch<T = any>(
  path: string,
  init: (RequestInit & { token?: string }) = {},
): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  if (init.body && !(init.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status}: ${JSON.stringify(json)}`);
  }
  return json as T;
}

async function registerIfNeeded(payload: Record<string, unknown>): Promise<void> {
  try {
    await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    console.log(`  registered ${payload.email}`);
  } catch (err) {
    console.log(`  register skipped for ${payload.email as string} (likely already exists): ${(err as Error).message}`);
  }
}

async function login(email: string, password: string): Promise<string> {
  const res = await apiFetch<{ twoFactorRequired: boolean; token: string | null }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.twoFactorRequired || !res.token) {
    throw new Error(`Login for ${email} did not return a token (2FA enabled?) — unsupported in the demo seed.`);
  }
  return res.token;
}

async function setBlockchainAddress(token: string, address: string): Promise<void> {
  await apiFetch('/users/me/blockchain-address', {
    method: 'PUT',
    token,
    body: JSON.stringify({ blockchainAddress: address }),
  });
}

async function resolveInterestIds(labels: string[]): Promise<string[]> {
  const interests = await apiFetch<{ id: string; label: string }[]>('/interests');
  const matched = interests.filter((i) => labels.some((l) => l.toLowerCase() === i.label.toLowerCase()));
  if (matched.length > 0) return matched.slice(0, 2).map((i) => i.id);
  if (interests.length === 0) {
    throw new Error('No interests configured in the backend — seed the interest table before running the demo.');
  }
  console.log(`  [warn] no interest matched ${JSON.stringify(labels)}, falling back to "${interests[0].label}"`);
  return [interests[0].id];
}

async function uploadImage(token: string, relativePath: string): Promise<{ ipfsHash: string; ipfsUrl: string }> {
  const absPath = join(REPO_ROOT, relativePath);
  if (!existsSync(absPath)) {
    console.log(`  [skip] image not found: ${relativePath} (add the file or edit demo-seed.json)`);
    return { ipfsHash: '', ipfsUrl: '' };
  }
  const form = new FormData();
  form.append('file', new Blob([readFileSync(absPath)]), absPath.split('/').pop()!);
  return apiFetch('/media/upload', { method: 'POST', token, body: form });
}

async function confirmBrandMedia(token: string, brandId: string, image: { ipfsHash: string; ipfsUrl: string }): Promise<void> {
  if (!image.ipfsHash) return;
  await apiFetch(`/brands/${brandId}/media/confirm`, {
    method: 'POST',
    token,
    body: JSON.stringify({ ipfsHash: image.ipfsHash, imageUrl: image.ipfsUrl }),
  });
}

// ── Phase A : tout ce qui ne touche pas la chaîne ────────────────────────

async function runPre(): Promise<void> {
  const demo = loadDemoSeed();

  console.log('== Bootstrap admin ==');
  await registerIfNeeded({
    email: demo.admin.bootstrapEmail,
    username: demo.admin.bootstrapUsername,
    firstName: demo.admin.bootstrapFirstName,
    lastName: demo.admin.bootstrapLastName,
    password: demo.admin.bootstrapPassword,
    ageRange: demo.admin.bootstrapAgeRange,
  });
  const adminToken = await login(demo.admin.bootstrapEmail, demo.admin.bootstrapPassword);

  for (let i = 0; i < demo.brandCount; i++) {
    const brand = demo.brands[i];
    console.log(`== Brand ${i}: ${brand.application.brandName} ==`);

    const brandAddress = privateKeyToAddress(requireEnv(brand.privateKeyEnv) as `0x${string}`);
    const interestIds = await resolveInterestIds(brand.application.interestLabels);
    const { interestLabels: _interestLabels, ...applicationFields } = brand.application;

    const application = await apiFetch<{ id: string }>('/brands/applications', {
      method: 'POST',
      body: JSON.stringify({ ...applicationFields, interestIds }),
    });
    console.log(`  application ${application.id} created`);

    const approval = await apiFetch<{
      userId: string;
      brandId: string;
      username: string;
      temporaryPassword?: string;
    }>(`/brands/applications/${application.id}/approve`, { method: 'PUT', token: adminToken });

    if (!approval.temporaryPassword) {
      throw new Error(
        'Approval did not return a temporaryPassword — set SKIP_EMAIL_VERIFICATION=true on the backend for demo seeding.',
      );
    }
    console.log(`  brand ${approval.brandId} approved (user ${approval.username})`);

    const brandToken = await login(brand.application.contactEmail, approval.temporaryPassword);
    await setBlockchainAddress(brandToken, brandAddress);

    await confirmBrandMedia(brandToken, approval.brandId, await uploadImage(brandToken, brand.logoImagePath));
    for (const mediaPath of brand.mediaImagePaths) {
      await confirmBrandMedia(brandToken, approval.brandId, await uploadImage(brandToken, mediaPath));
    }

    const eventOutput: Record<string, string> = {};
    for (let e = 0; e < brand.eventCount; e++) {
      const ev = brand.events[e];
      const cover = await uploadImage(brandToken, ev.imagePath);
      const created = await apiFetch<{ id: string }>('/events', {
        method: 'POST',
        token: brandToken,
        body: JSON.stringify({
          title: ev.title,
          type: 'other',
          description: ev.title,
          startsAt: new Date(ev.startTime * 1000).toISOString(),
          endsAt: new Date(ev.endTime * 1000).toISOString(),
          coverImageUrl: cover.ipfsUrl || undefined,
        }),
      });
      eventOutput[`brand${i}_event${e}_eventId`] = created.id;
      console.log(`  event ${e} draft created: ${created.id}`);
    }

    writeOutput({
      [`brand${i}_brandId`]: approval.brandId,
      [`brand${i}_userId`]: approval.userId,
      [`brand${i}_username`]: approval.username,
      [`brand${i}_contactEmail`]: brand.application.contactEmail,
      [`brand${i}_temporaryPassword`]: approval.temporaryPassword,
      [`brand${i}_address`]: brandAddress,
      ...eventOutput,
    });
  }

  for (let c = 0; c < demo.clientCount; c++) {
    const client = demo.clients[c];
    console.log(`== Client ${c}: ${client.email} ==`);
    await registerIfNeeded({
      email: client.email,
      username: client.username,
      firstName: client.firstName,
      lastName: client.lastName,
      password: client.password,
      ageRange: client.ageRange,
    });
    const clientToken = await login(client.email, client.password);
    const clientAddress = privateKeyToAddress(requireEnv(client.privateKeyEnv) as `0x${string}`);
    await setBlockchainAddress(clientToken, clientAddress);
  }

  console.log('\nPhase A (pre) done. Next: run the forge script SeedDemo.s.sol, then `seed-api.ts post`.');
}

// ── Phase C : lier les contrats déployés et publier les événements ───────

async function waitForTicketSale(
  token: string,
  eventId: string,
  eventTicketsAddress: string,
  freeEvent: boolean,
  attempts = 12,
  delayMs = 5000,
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    const event = await apiFetch<{ ticketSaleAddress: string | null }>(`/events/${eventId}/contracts`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ eventTicketsAddress, paymentFree: freeEvent }),
    });
    if (event.ticketSaleAddress) return true;
    console.log(`  ticketSaleAddress not indexed yet, retrying in ${delayMs / 1000}s (chain-sync running?)`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

async function runPost(): Promise<void> {
  const demo = loadDemoSeed();
  const output = readOutput();

  for (let i = 0; i < demo.brandCount; i++) {
    const brand = demo.brands[i];
    const contactEmail = output[`brand${i}_contactEmail`];
    const temporaryPassword = output[`brand${i}_temporaryPassword`];
    if (!contactEmail || !temporaryPassword) {
      throw new Error(`Missing brand${i} credentials in ${OUTPUT_PATH} — run "pre" first.`);
    }
    const brandToken = await login(contactEmail, temporaryPassword);

    for (let e = 0; e < brand.eventCount; e++) {
      const eventId = output[`brand${i}_event${e}_eventId`];
      const eventTicketsAddress = output[`brand${i}_event${e}_eventTickets`];
      if (!eventId || !eventTicketsAddress) {
        throw new Error(
          `Missing brand${i} event${e} data in ${OUTPUT_PATH} — run "pre" then the forge script first.`,
        );
      }

      console.log(`== Linking event ${eventId} (brand ${i}, event ${e}) ==`);
      const freeEvent = brand.events[e].freeEvent;
      const linked = await waitForTicketSale(brandToken, eventId, eventTicketsAddress, freeEvent);
      if (!linked) {
        console.log(
          `  [warn] ticketSaleAddress never appeared — is chain-sync running (CHAIN_SYNC_ENABLED=true, correct RPC)? Skipping publish for ${eventId}.`,
        );
        continue;
      }

      await apiFetch(`/events/${eventId}/publish`, { method: 'PATCH', token: brandToken });
      console.log(`  event ${eventId} published`);
    }
  }

  console.log('\nPhase C (post) done. Demo data is live.');
}

const phase = process.argv[2];
if (phase === 'pre') {
  await runPre();
} else if (phase === 'post') {
  await runPost();
} else {
  console.error('Usage: npx tsx demo/seed-api.ts pre|post');
  process.exit(1);
}
