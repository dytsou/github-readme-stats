// @ts-check

const GITHUB_PAT_KEY_REGEX = /^GITHUB_PAT(_\d+)?$/;

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
  Object.keys(process.env)
    .filter((key) => GITHUB_PAT_KEY_REGEX.test(key))
    .sort((a, b) => getGitHubPatIndex(a) - getGitHubPatIndex(b));

/**
 * @param {number} index Zero-based PAT index.
 * @returns {string|undefined} PAT token for the given index.
 */
const getGitHubPatToken = (index) => {
  const key = getGitHubPatKeys()[index];
  return key ? process.env[key] : undefined;
};

export {
  GITHUB_PAT_KEY_REGEX,
  getGitHubPatIndex,
  getGitHubPatKeys,
  getGitHubPatToken,
};
