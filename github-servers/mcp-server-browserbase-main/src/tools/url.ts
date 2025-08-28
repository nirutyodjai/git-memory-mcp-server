import { z } from "zod";
import type { Tool, ToolSchema, ToolResult } from "./tool.js";
import type { Context } from "../context.js";
import type { ToolActionResult } from "../types/types.js";
import * as stagehandStore from "../stagehandStore.js";

// Empty schema since getting URL doesn't require any input
const GetUrlInputSchema = z.object({});
type GetUrlInput = z.infer<typeof GetUrlInputSchema>;

// Schema for getting all session URLs
const GetAllUrlsInputSchema = z.object({});
type GetAllUrlsInput = z.infer<typeof GetAllUrlsInputSchema>;

const getUrlSchema: ToolSchema<typeof GetUrlInputSchema> = {
  name: "browserbase_stagehand_get_url",
  description:
    "Gets the current URL of the browser page. Returns the complete URL including protocol, domain, path, and any query parameters or fragments.",
  inputSchema: GetUrlInputSchema,
};

async function handleGetUrl(
  context: Context,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  params: GetUrlInput,
): Promise<ToolResult> {
  const action = async (): Promise<ToolActionResult> => {
    try {
      const stagehand = await context.getStagehand();

      // Get the current URL from the Playwright page
      const currentUrl = stagehand.page.url();

      return {
        content: [
          {
            type: "text",
            text: currentUrl,
          },
        ],
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get current URL: ${errorMsg}`);
    }
  };

  return {
    action,
    waitForNetwork: false,
  };
}

const getUrlTool: Tool<typeof GetUrlInputSchema> = {
  capability: "core",
  schema: getUrlSchema,
  handle: handleGetUrl,
};

// Schema for getting all session URLs
const getAllUrlsSchema: ToolSchema<typeof GetAllUrlsInputSchema> = {
  name: "browserbase_stagehand_get_all_urls",
  description:
    "Gets the current URLs of all active browser sessions. Returns a mapping of session IDs to their current URLs.",
  inputSchema: GetAllUrlsInputSchema,
};

async function handleGetAllUrls(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: Context,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  params: GetAllUrlsInput,
): Promise<ToolResult> {
  const action = async (): Promise<ToolActionResult> => {
    try {
      const sessions = stagehandStore.list();

      if (sessions.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No active sessions found",
            },
          ],
        };
      }

      // Collect URLs from all sessions
      const sessionUrls: Record<string, string> = {};

      for (const session of sessions) {
        try {
          const url = session.page.url();
          sessionUrls[session.id] = url;
        } catch (error) {
          // If we can't get URL for a session, mark it as error
          sessionUrls[session.id] =
            `<error: ${error instanceof Error ? error.message : "unknown"}>`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(sessionUrls, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get session URLs: ${errorMsg}`);
    }
  };

  return {
    action,
    waitForNetwork: false,
  };
}

export const getAllUrlsTool: Tool<typeof GetAllUrlsInputSchema> = {
  capability: "core",
  schema: getAllUrlsSchema,
  handle: handleGetAllUrls,
};

export default getUrlTool;
