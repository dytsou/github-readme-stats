// @ts-check

const GITHUB_PAT_KEY_REGEX = /^GITHUB_PAT(_\d+)?$/;

/**
 * Returns the runtime environment object.
 * In Cloudflare Workers, Wrangler inlines `process.env` at build time, so PAT
 * secrets copied into `globalThis.process.env` must be read from there instead.
 * @returns {NodeJS.ProcessEnv} Runtime environment variables.
 */
const getRuntimeEnv = () => globalThis.process?.env ?? process.env;

/**
 * @param {string} key GitHub PAT environment variable name.
 * @returns {number} Sort index for the PAT key.
 */
const getGitHubPatIndex = (key) => {
  if (key === "GITHUB_PAT") {
    return 1;
  }

  const match = key.match(/^GITHUB_PAT_(\d+)$/);
  return match ? Number(match[1]) : Number.NaN;
};

/**
 * @returns {string[]} Sorted GitHub PAT environment variable names.
 */
const getGitHubPatKeys = () =>
  Object.keys(getRuntimeEnv())
    .filter((key) => GITHUB_PAT_KEY_REGEX.test(key))
    .sort((a, b) => getGitHubPatIndex(a) - getGitHubPatIndex(b));

/**
 * @param {number} index Zero-based PAT index.
 * @returns {string|undefined} PAT token for the given index.
 */
const getGitHubPatToken = (index) => {
  const key = getGitHubPatKeys()[index];
  const env = getRuntimeEnv();
  return key ? env[key] : undefined;
};

export {
  GITHUB_PAT_KEY_REGEX,
  getGitHubPatIndex,
  getGitHubPatKeys,
  getGitHubPatToken,
};
