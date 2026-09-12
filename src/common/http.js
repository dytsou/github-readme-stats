// @ts-check

import axios from "axios";

// Cloudflare Workers supports `no-store` and `no-cache`, but rejects the
// default Fetch cache mode when Axios creates a subrequest.
const cloudflareFetchOptions = { cache: "no-store" };

/**
 * Send GraphQL request to GitHub API.
 *
 * @param {import('axios').AxiosRequestConfig['data']} data Request data.
 * @param {import('axios').AxiosRequestConfig['headers']} headers Request headers.
 * @returns {Promise<any>} Request response.
 */
const request = (data, headers) => {
  return axios({
    url: "https://api.github.com/graphql",
    method: "post",
    headers: {
      "User-Agent": "github-readme-stats",
      ...headers,
    },
    fetchOptions: cloudflareFetchOptions,
    data,
  });
};

export { cloudflareFetchOptions, request };
