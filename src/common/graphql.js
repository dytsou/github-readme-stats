// @ts-check

/**
 * Shared GraphQL response error handling for GitHub fetchers.
 */

import { CustomError } from "./error.js";
import { wrapTextMultiline } from "./fmt.js";
import { logger } from "./log.js";

/**
 * Throw a CustomError when a GitHub GraphQL response contains errors.
 *
 * @param {any} res Axios-like response with `data.errors`.
 * @param {string} fallbackMessage Message used when no GraphQL error message exists.
 * @returns {void}
 */
const throwIfGraphQLErrors = (res, fallbackMessage) => {
  if (!res?.data?.errors) {
    return;
  }

  logger.error(res.data.errors);
  if (res.data.errors[0].type === "NOT_FOUND") {
    throw new CustomError(
      res.data.errors[0].message || "Could not fetch user.",
      CustomError.USER_NOT_FOUND,
    );
  }
  if (res.data.errors[0].message) {
    throw new CustomError(
      wrapTextMultiline(res.data.errors[0].message, 90, 1)[0],
      res.statusText,
    );
  }
  throw new CustomError(fallbackMessage, CustomError.GRAPHQL_ERROR);
};

export { throwIfGraphQLErrors };
