import browser from "webextension-polyfill";
import logger from "./logger";

browser.runtime.onInstalled.addListener(() => {
  logger.info("Gradia extension installed");
});
