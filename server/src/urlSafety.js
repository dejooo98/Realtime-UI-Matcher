import dns from "node:dns/promises";
import net from "node:net";
import ipaddr from "ipaddr.js";

/** Max URL length (defense in depth with CDN / proxy limits). */
export const MAX_URL_LENGTH = 2048;

export class UrlSafetyError extends Error {
	constructor(message) {
		super(message);
		this.name = "UrlSafetyError";
	}
}

/**
 * Block loopback, private, link-local, ULA, CGNAT — SSRF protection for SaaS.
 * @param {import('ipaddr.js').IPv4 | import('ipaddr.js').IPv6} addr
 */
function isDisallowedRange(addr) {
	const r = addr.range();
	return (
		r === "loopback" ||
		r === "private" ||
		r === "linkLocal" ||
		r === "uniqueLocal" ||
		r === "carrierGradeNat"
	);
}

function assertIpStringAllowed(ipString) {
	let addr;
	try {
		addr = ipaddr.parse(ipString);
	} catch {
		throw new UrlSafetyError("Invalid URL.");
	}
	if (isDisallowedRange(addr)) {
		throw new UrlSafetyError(
			"That address is not allowed. Use a public http(s) URL."
		);
	}
}

/**
 * Resolve hostname to A + AAAA and ensure every address is public.
 * @param {string} hostname
 */
async function resolveAndAssertPublic(hostname) {
	const ips = [];
	try {
		ips.push(...(await dns.resolve4(hostname)));
	} catch {
		/* ENODATA / ENOTFOUND — try AAAA only */
	}
	try {
		ips.push(...(await dns.resolve6(hostname)));
	} catch {
		/* ignore if no AAAA */
	}
	if (ips.length === 0) {
		throw new UrlSafetyError("Could not resolve host. Check the URL.");
	}
	for (const ip of ips) {
		assertIpStringAllowed(ip);
	}
}

/**
 * Validate URL scheme/host and block SSRF to internal networks.
 * @param {string} urlString
 * @returns {Promise<string>} trimmed canonical string for Puppeteer
 */
export async function assertSafeUrl(urlString) {
	if (typeof urlString !== "string") {
		throw new UrlSafetyError("URL must be text.");
	}
	const trimmed = urlString.trim();
	if (!trimmed) {
		throw new UrlSafetyError("URL is required.");
	}
	if (trimmed.length > MAX_URL_LENGTH) {
		throw new UrlSafetyError("URL is too long.");
	}

	let url;
	try {
		url = new URL(trimmed);
	} catch {
		throw new UrlSafetyError("Invalid URL. Use a full https:// or http:// link.");
	}

	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new UrlSafetyError("Only http and https URLs are allowed.");
	}

	if (url.username || url.password) {
		throw new UrlSafetyError(
			"URLs with embedded usernames or passwords are not allowed."
		);
	}

	const host = url.hostname;
	if (!host) {
		throw new UrlSafetyError("Invalid URL.");
	}

	const hostLower = host.toLowerCase();
	if (hostLower === "localhost" || hostLower.endsWith(".localhost")) {
		throw new UrlSafetyError("Localhost URLs are not allowed.");
	}

	if (net.isIPv4(host)) {
		assertIpStringAllowed(host);
		return trimmed;
	}

	if (net.isIPv6(host)) {
		const ip = host.startsWith("[") ? host.slice(1, -1) : host;
		assertIpStringAllowed(ip);
		return trimmed;
	}

	await resolveAndAssertPublic(host);
	return trimmed;
}
