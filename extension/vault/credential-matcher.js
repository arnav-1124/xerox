/**
 * Strict domain and origin matching for safe autofill
 */

export function extractDomain(urlOrHostname) {
  if (!urlOrHostname) return '';
  try {
    let raw = urlOrHostname.trim().toLowerCase();
    if (raw.includes('://')) raw = new URL(raw).hostname;
    else if (raw.includes('/')) raw = raw.split('/')[0];
    return raw.split(':')[0].replace(/^www\./, '');
  } catch (e) {
    return urlOrHostname.trim().toLowerCase().split('/')[0].split(':')[0].replace(/^www\./, '');
  }
}

export function getRootDomain(hostname) {
  const cleanHost = extractDomain(hostname);
  if (!cleanHost) return '';
  const parts = cleanHost.split('.');
  if (parts.length <= 2) return cleanHost;
  return parts.slice(-2).join('.');
}

function cleanString(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isSafeDomainMatch(pageUrl, credentialUrl) {
  if (!pageUrl) return false;
  const pageHost = extractDomain(pageUrl);
  const pageRoot = getRootDomain(pageHost);

  if (!credentialUrl) return false;
  const credHost = extractDomain(credentialUrl);
  const credRoot = getRootDomain(credHost);

  if (pageHost && credHost && pageHost === credHost) return true;
  if (pageRoot && credRoot && pageRoot === credRoot && pageRoot.length > 2) return true;
  if (pageRoot && credHost && (credHost.includes(pageRoot) || pageHost.includes(credHost))) return true;

  const cleanPage = cleanString(pageHost);
  const cleanCred = cleanString(credentialUrl);
  if (cleanPage && cleanCred && cleanCred.length >= 3) {
    if (cleanPage.includes(cleanCred) || cleanCred.includes(cleanPage)) return true;
  }

  return false;
}

export function filterMatchingCredentials(pageUrl, credentials) {
  if (!pageUrl || !Array.isArray(credentials)) return [];
  return credentials.filter((item) => {
    const target = item.websiteUrl || item.url || item.websiteName || item.title;
    return isSafeDomainMatch(pageUrl, target);
  });
}
