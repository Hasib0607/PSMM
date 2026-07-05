import dns from "dns";
import { promisify } from "util";

const dnsLookup = promisify(dns.lookup);

export async function isSafeUrl(urlStr: string): Promise<boolean> {
  try {
    const parsed = new URL(urlStr);
    
    // Only allow standard http/https schemes
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    
    const hostname = parsed.hostname;

    // Reject direct IP access to be safe
    if (/^[0-9.]+$/.test(hostname) || hostname.includes("[")) {
      return isPublicIp(hostname);
    }

    const { address } = await dnsLookup(hostname);
    return isPublicIp(address);
  } catch (e) {
    return false;
  }
}

function isPublicIp(ip: string): boolean {
  // Check IPv4
  if (/^[0-9.]+$/.test(ip)) {
    const parts = ip.split(".").map(p => parseInt(p, 10));
    if (parts.length !== 4 || parts.some(isNaN)) {
      return false;
    }

    const [a, b] = parts;

    // Loopback: 127.0.0.0/8
    if (a === 127) return false;

    // Private networks:
    // 10.0.0.0/8
    if (a === 10) return false;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return false;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return false;

    // Link-local / Cloud metadata: 169.254.0.0/16
    if (a === 169 && b === 254) return false;

    // Local broadcast: 0.0.0.0
    if (a === 0) return false;

    return true;
  }

  // Check IPv6
  if (ip.includes(":")) {
    const cleaned = ip.toLowerCase();
    
    // Loopback ::1
    if (cleaned === "::1" || cleaned === "0:0:0:0:0:0:0:1") return false;
    
    // Unique local address fc00::/7
    if (cleaned.startsWith("fc") || cleaned.startsWith("fd")) return false;
    
    // Link-local address fe80::/10
    if (cleaned.startsWith("fe8") || cleaned.startsWith("fe9") || cleaned.startsWith("fea") || cleaned.startsWith("feb")) return false;

    return true;
  }

  return false;
}
