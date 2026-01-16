/**
 * URL Validation Utils
 *
 * Security utilities for validating URLs to prevent SSRF attacks.
 */

import { TRPCError } from "@trpc/server";

/**
 * Private IP ranges and special addresses that should be blocked
 */
const BLOCKED_IP_PATTERNS = [
  // IPv4 Loopback
  /^127\./,
  // IPv4 Private networks
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  // IPv4 Link-local
  /^169\.254\./,
  // IPv4 Broadcast
  /^255\.255\.255\.255$/,
  // IPv6 Loopback
  /^::1$/,
  /^::ffff:127\./i,
  // IPv4-mapped IPv6 addresses (private ranges)
  /^::ffff:10\./i,
  /^::ffff:172\.(1[6-9]|2\d|3[01])\./i,
  /^::ffff:192\.168\./i,
  /^::ffff:169\.254\./i,
  // IPv6 Private networks
  /^fe80:/i,
  /^fc00:/i,
  /^fd00:/i,
];

/**
 * Allowed protocols for external URLs
 */
const ALLOWED_PROTOCOLS = ["http:", "https:"];

/**
 * Cloud metadata endpoints that must be blocked
 */
const BLOCKED_HOSTNAMES = [
  "169.254.169.254", // AWS, Azure, GCP metadata
  "metadata.google.internal", // GCP metadata
  "169.254.170.2", // AWS ECS metadata
  "fd00:ec2::254", // AWS IMDSv2 IPv6
];

/**
 * Validate URL to prevent SSRF attacks
 *
 * @param urlString - URL to validate
 * @throws TRPCError if URL is invalid or potentially malicious
 */
export function validateExternalUrl(urlString: string): void {
  let parsedUrl: URL;

  // Parse URL
  try {
    parsedUrl = new URL(urlString);
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid URL format",
    });
  }

  // Check protocol
  if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Protocol ${parsedUrl.protocol} is not allowed. Only HTTP and HTTPS are permitted.`,
    });
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // Check for blocked hostnames (cloud metadata endpoints)
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Access to cloud metadata endpoints is not allowed",
    });
  }

  // Check for localhost variations
  if (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "0000:0000:0000:0000:0000:0000:0000:0001"
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Access to localhost is not allowed",
    });
  }

  // Check for private/internal IP addresses
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Access to private IP addresses is not allowed",
      });
    }
  }

  // Additional check: ensure hostname doesn't resolve to a blocked IP
  // Note: We can't do DNS resolution synchronously here, but we've covered
  // the most common attack vectors. For production, consider:
  // 1. Using a separate DNS resolver that checks responses
  // 2. Maintaining an allow-list of trusted domains
  // 3. Using a proxy service that performs these checks

  // Check for URL encoding bypass attempts (case-insensitive)
  const lowerUrl = urlString.toLowerCase();
  if (
    lowerUrl.includes("%00") || // null byte
    lowerUrl.includes("%0d") || // carriage return
    lowerUrl.includes("%0a") // line feed
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "URL contains invalid encoded characters",
    });
  }

  // Check for redirect bypass attempts (e.g., @)
  if (parsedUrl.username || parsedUrl.password) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "URLs with authentication credentials are not allowed",
    });
  }
}

/**
 * Additional validation: Check if hostname is an IP address
 *
 * @param hostname - Hostname to check
 * @returns true if hostname is an IP address
 */
function isIpAddress(hostname: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;

  return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname);
}

/**
 * Validate that URL points to a public domain (not IP address)
 * This is a stricter validation that can be optionally used
 *
 * @param urlString - URL to validate
 * @throws TRPCError if URL uses IP address instead of domain
 */
export function requirePublicDomain(urlString: string): void {
  validateExternalUrl(urlString); // First run basic validation

  const parsedUrl = new URL(urlString);

  if (isIpAddress(parsedUrl.hostname)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Direct IP addresses are not allowed. Please use a domain name.",
    });
  }
}
