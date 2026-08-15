/**
 * Strict deterministic domain and origin matching for safe autofill.
 * Avoids fuzzy or insecure substring matches.
 */

export function extractDomain(urlOrHostname) {
  if (!urlOrHostname) return '';
  try {
    let raw = urlOrHostname.trim().toLowerCase();
    if (raw.includes('://')) {
      raw = new URL(raw).hostname;
    } else {
      if (raw.includes('/')) raw = raw.split('/')[0];
      if (raw.includes('?')) raw = raw.split('?')[0];
      if (raw.includes('#')) raw = raw.split('#')[0];
    }
    // Remove port if present
    raw = raw.split(':')[0];
    // Remove leading www.
    return raw.replace(/^www\./, '');
  } catch (e) {
    let fallback = urlOrHostname.trim().toLowerCase().split('/')[0].split(':')[0];
    return fallback.replace(/^www\./, '');
  }
}

export function getRootDomain(hostname) {
  const cleanHost = extractDomain(hostname);
  if (!cleanHost) return '';
  const parts = cleanHost.split('.');
  if (parts.length <= 2) return cleanHost;
  return parts.slice(-2).join('.');
}

export function isSafeDomainMatch(pageUrl, credentialUrl) {
  if (!pageUrl || !credentialUrl) return false;
  
  const pageHost = extractDomain(pageUrl);
  const credHost = extractDomain(credentialUrl);

  if (!pageHost || !credHost) return false;

  // 1. Exact match (e.g. github.com === github.com or sub.github.com === sub.github.com)
  if (pageHost === credHost) return true;

  // 2. Strict subdomain match: pageHost is a legitimate subdomain of credHost
  // e.g. login.github.com is a subdomain of github.com
  if (pageHost.endsWith('.' + credHost)) return true;

  // Reject all fuzzy/substring matches (e.g. github.com.attacker.com or attacker-github.com)
  return false;
}

export function filterMatchingCredentials(pageUrl, credentials) {
  if (!pageUrl || !Array.isArray(credentials)) return [];
  return credentials.filter((item) => {
    const target = item.websiteUrl || item.url || item.websiteName;
    return isSafeDomainMatch(pageUrl, target);
  });
}
