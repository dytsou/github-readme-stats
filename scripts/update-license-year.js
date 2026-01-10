/**
 * @file Updates the LICENSE file with the current year for dytsou's copyright.
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LICENSE_PATH = join(__dirname, "..", "LICENSE");

/**
 * Updates the copyright year in LICENSE file to the current year.
 *
 * @returns {boolean} True if the file was updated, false otherwise.
 */
const updateLicenseYear = () => {
  const currentYear = new Date().getFullYear();
  let licenseContent = readFileSync(LICENSE_PATH, "utf8");

  // Match the copyright line and update dytsou's year
  // Pattern: Copyright (c) 2020 Anurag Hazra Copyright (c) YYYY dytsou
  const copyrightRegex =
    /(Copyright \(c\) \d+ Anurag Hazra Copyright \(c\) )\d+( dytsou)/;

  if (!copyrightRegex.test(licenseContent)) {
    console.log("⚠ Could not find expected copyright pattern in LICENSE");
    return false; // File was not updated
  }

  const updatedContent = licenseContent.replace(
    copyrightRegex,
    `$1${currentYear}$2`,
  );

  // Only update if content actually changed
  if (updatedContent === licenseContent) {
    console.log(
      `LICENSE copyright year is already ${currentYear}, no update needed`,
    );
    return false; // File was not updated
  }

  writeFileSync(LICENSE_PATH, updatedContent, "utf8");
  console.log(`Updated LICENSE copyright year to ${currentYear}`);
  return true; // File was updated
};

updateLicenseYear();
