import {
  expect,
  type APIRequestContext,
  type APIResponse,
} from "@playwright/test";
import { z } from "zod";
import {
  directorySchema,
  yardSchema,
  parseSearchPage,
  parseSearchCount,
  type DirectoryPayload,
  type YardPayload,
  type SearchPagePayload,
  type SearchCountPayload,
} from "./schemas";

const envelopeSchema = z.object({
  props: z.object({ pageProps: z.unknown() }),
});

/** Own HTTP access and validate untrusted payloads before returning typed data. */
export class AuctionClient {
  constructor(private readonly request: APIRequestContext) {}

  private async pageProps(path: string): Promise<unknown> {
    const response = await this.request.get(path);
    expect(response.status(), `GET ${path}`).toBe(200);
    expect(response.headers()["content-type"], `GET ${path}`).toContain(
      "text/html",
    );
    const json = (await response.text()).match(
      /<script\b[^>]*\bid="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
    )?.[1];
    if (json === undefined)
      throw new Error(`Next.js JSON missing from ${path}`);
    const payload: unknown = JSON.parse(json);
    return envelopeSchema.parse(payload).props.pageProps;
  }

  private async searchResponse(
    freeText: string,
    size: number,
  ): Promise<unknown> {
    const response: APIResponse = await this.request.post("/api/search", {
      data: { freeText, from: 0, size },
    });
    expect(response.status(), "POST /api/search").toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    const payload: unknown = await response.json();
    return payload;
  }

  async directory(): Promise<DirectoryPayload> {
    return directorySchema.parse(await this.pageProps("/lp"));
  }

  async yard(): Promise<YardPayload> {
    return yardSchema.parse(await this.pageProps("/lp/edmonton-ab"));
  }

  async search(freeText: string, size = 60): Promise<SearchPagePayload> {
    return parseSearchPage(await this.searchResponse(freeText, size));
  }

  async searchCount(freeText: string): Promise<SearchCountPayload> {
    return parseSearchCount(await this.searchResponse(freeText, 0));
  }
}
