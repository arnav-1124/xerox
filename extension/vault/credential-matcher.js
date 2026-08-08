/**
 * Strict domain and origin matching for safe autofill
 */

export function extractDomain(urlOrHostname) {
  if (!urlOrHostname) return '';
  try {
    let hostname = urlOrHostname;
    if (urlOrHostname.includes('://')) {
      hostname = new URL(urlOrHostname).hostname;
    } else if (urlOrHostname.includes('/')) {
      hostname = urlOrHostname.split('/')[0];
    }
    
    // Remove port numbers if present
    hostname = hostname.split(':')[0].toLowerCase();
    return hostname;
  } catch (e) {
    return '';
  }
}

// Get effective root domain (e.g. "sub.github.com" -> "github.com")
export function getRootDomain(hostname) {
  const cleanHost = extractDomain(hostname);
  if (!cleanHost) return '';

  const parts = cleanHost.split('.');
  if (parts.length <= 2) {
    return cleanHost;
  }

  // Handle common TLDs like .co.uk, .com.au if needed, default to last 2 parts
  const lastTwo = parts.slice(-2).join('.');
  return lastTwo;
}

/**
 * Strict origin match check
 * @param {string} pageUrl - The current page URL in tab
 * @param {string} credentialUrl - The URL saved with the password entry
 * @returns {boolean} True if matching safely
 */
export function isSafeDomainMatch(pageUrl, credentialUrl) {
  const pageHost = extractDomain(pageUrl);
  const credHost = extractDomain(credentialUrl);

  if (!pageHost || !credHost) return false;

  // Exact match
  if (pageHost === credHost) return true;

  // Subdomain check: e.g. "auth.github.com" vs "github.com"
  const pageRoot = getRootDomain(pageHost);
  const credRoot = getRootDomain(credHost);

  // Exact root domain match and pageHost ends with credRoot or vice versa
  if (pageRoot === credRoot && pageRoot.length > 3) {
    // Ensure it's a true subdomain boundary (.github.com) and not fake (attacker-github.com)
    if (pageHost === credRoot || pageHost.endsWith('.' + credRoot)) {
      if (credHost === pageRoot || credHost.endsWith('.' + pageRoot)) {
        return true;
      }
    }
  }

  return false;
}

export function filterMatchingCredentials(pageUrl, credentials) {
  if (!pageUrl || !Array.isArray(credentials)) return [];
  return credentials.filter((item) => isSafeDomainMatch(pageUrl, item.websiteUrl || item.url));
}
