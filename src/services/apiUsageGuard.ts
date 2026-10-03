/**
 * MindSathi API & Firestore Usage Protection Service
 *
 * Enforces client-side guardrails to guarantee ZERO unbudgeted or runaway API calls:
 * - Daily quota limits for Sahara AI chat and Cognitive AI Reports
 * - Minimum cooldown between user-initiated AI calls
 * - Duplicate request and in-flight debounce protections
 * - Date-keyed local persistence with automatic midnight resets
 */

export const SAHARA_DAILY_LIMIT = 30;
export const REPORT_DAILY_LIMIT = 10;
export const GLOBAL_AI_DAILY_LIMIT = 40;
export const AI_REQUEST_COOLDOWN_MS = 3000;

export const SAHARA_LIMIT_FALLBACK_TEXT =
  "AI help is temporarily limited for today. You can continue using your activities and try again tomorrow.";

export const REPORT_LIMIT_NOTICE_TEXT =
  "Latest report is being kept. A new AI report can be generated later.";

interface DailyUsageRecord {
  date: string;
  saharaCount: number;
  reportCount: number;
  globalCount: number;
}

const STORAGE_PREFIX = "mindsathi_ai_quota";
let inMemoryLastSaharaTimestamp = 0;
let inMemorySaharaInFlight = false;

function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getUsageRecord(): DailyUsageRecord {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}_${today}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        return {
          date: today,
          saharaCount: Number(parsed.saharaCount) || 0,
          reportCount: Number(parsed.reportCount) || 0,
          globalCount: Number(parsed.globalCount) || 0,
        };
      }
    }
  } catch {
    // Fallback to fresh record if storage is blocked
  }

  return {
    date: today,
    saharaCount: 0,
    reportCount: 0,
    globalCount: 0,
  };
}

function saveUsageRecord(record: DailyUsageRecord): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}_${record.date}`, JSON.stringify(record));
    // Clean up older keys to keep localStorage tidy
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX) && key !== `${STORAGE_PREFIX}_${record.date}`) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Gracefully handle storage errors
  }
}

/**
 * Checks if a Sahara AI request is permitted under daily quota, global quota, and cooldown.
 */
export function checkSaharaRequestAllowed(): {
  allowed: boolean;
  reason?: "daily_limit" | "global_limit" | "cooldown" | "in_flight";
  message?: string;
  remainingDaily?: number;
} {
  if (inMemorySaharaInFlight) {
    return {
      allowed: false,
      reason: "in_flight",
      message: "A request is already being processed. Please wait a moment.",
    };
  }

  const now = Date.now();
  const timeSinceLast = now - inMemoryLastSaharaTimestamp;
  if (timeSinceLast < AI_REQUEST_COOLDOWN_MS) {
    return {
      allowed: false,
      reason: "cooldown",
      message: "Please wait a moment before sending another message.",
    };
  }

  const usage = getUsageRecord();
  if (usage.saharaCount >= SAHARA_DAILY_LIMIT) {
    return {
      allowed: false,
      reason: "daily_limit",
      message: SAHARA_LIMIT_FALLBACK_TEXT,
      remainingDaily: 0,
    };
  }

  if (usage.globalCount >= GLOBAL_AI_DAILY_LIMIT) {
    return {
      allowed: false,
      reason: "global_limit",
      message: SAHARA_LIMIT_FALLBACK_TEXT,
      remainingDaily: 0,
    };
  }

  return {
    allowed: true,
    remainingDaily: Math.max(0, SAHARA_DAILY_LIMIT - usage.saharaCount),
  };
}

/**
 * Marks a Sahara AI request as in-flight and updates the cooldown timer.
 */
export function startSaharaRequest(): void {
  inMemorySaharaInFlight = true;
  inMemoryLastSaharaTimestamp = Date.now();
}

/**
 * Completes a Sahara AI request, increments persistent daily quota, and releases in-flight lock.
 */
export function completeSaharaRequest(success = true): void {
  inMemorySaharaInFlight = false;
  inMemoryLastSaharaTimestamp = Date.now();

  if (success) {
    const usage = getUsageRecord();
    usage.saharaCount += 1;
    usage.globalCount += 1;
    saveUsageRecord(usage);
  }
}

/**
 * Checks if an AI Cognitive Report generation is permitted under daily quota and global quota.
 */
export function checkReportGenerationAllowed(): {
  allowed: boolean;
  reason?: "daily_limit" | "global_limit";
  message?: string;
  remainingDaily?: number;
} {
  const usage = getUsageRecord();
  if (usage.reportCount >= REPORT_DAILY_LIMIT) {
    return {
      allowed: false,
      reason: "daily_limit",
      message: REPORT_LIMIT_NOTICE_TEXT,
      remainingDaily: 0,
    };
  }

  if (usage.globalCount >= GLOBAL_AI_DAILY_LIMIT) {
    return {
      allowed: false,
      reason: "global_limit",
      message: REPORT_LIMIT_NOTICE_TEXT,
      remainingDaily: 0,
    };
  }

  return {
    allowed: true,
    remainingDaily: Math.max(0, REPORT_DAILY_LIMIT - usage.reportCount),
  };
}

/**
 * Records a completed AI Cognitive Report generation into daily quota.
 */
export function recordReportGeneration(): void {
  const usage = getUsageRecord();
  usage.reportCount += 1;
  usage.globalCount += 1;
  saveUsageRecord(usage);
}

/**
 * In-memory weather cache to prevent repeated external Open-Meteo lookups.
 */
interface WeatherCacheEntry {
  timestamp: number;
  data: string;
}
const weatherCache = new Map<string, WeatherCacheEntry>();
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function getCachedWeather(city: string): string | null {
  const key = city.trim().toLowerCase();
  const entry = weatherCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > WEATHER_CACHE_TTL_MS) {
    weatherCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedWeather(city: string, data: string): void {
  const key = city.trim().toLowerCase();
  weatherCache.set(key, { timestamp: Date.now(), data });
}

/**
 * Returns current daily AI usage statistics for diagnostics without exposing sensitive data.
 */
export function getDailyAiUsageSummary(): {
  today: string;
  saharaCount: number;
  saharaLimit: number;
  reportCount: number;
  reportLimit: number;
  globalCount: number;
  globalLimit: number;
} {
  const usage = getUsageRecord();
  return {
    today: usage.date,
    saharaCount: usage.saharaCount,
    saharaLimit: SAHARA_DAILY_LIMIT,
    reportCount: usage.reportCount,
    reportLimit: REPORT_DAILY_LIMIT,
    globalCount: usage.globalCount,
    globalLimit: GLOBAL_AI_DAILY_LIMIT,
  };
}
