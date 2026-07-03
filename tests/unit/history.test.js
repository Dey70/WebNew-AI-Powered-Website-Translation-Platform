import { describe, it, expect, vi, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";

vi.mock("@/lib/auth/apiKeys", () => ({
  resolveSiteFromRequest: vi.fn(),
  AUTH_ERROR_MESSAGES: {
    missing_api_key: "An API key is required",
    invalid_api_key: "The provided API key is invalid",
    site_inactive: "This site is no longer active",
    origin_not_allowed: "This API key is not authorized for the requesting origin",
  },
}));
vi.mock("@/lib/history", () => ({
  saveTranslation: vi.fn(),
  listTranslations: vi.fn(),
  deleteTranslation: vi.fn(),
  clearTranslations: vi.fn(),
}));

import { resolveSiteFromRequest } from "@/lib/auth/apiKeys";
import { saveTranslation, listTranslations, deleteTranslation, clearTranslations } from "@/lib/history";
import historyHandler from "../../pages/api/history.js";
import clearHistoryHandler from "../../pages/api/clearHistory.js";
import deleteHandler from "../../pages/api/delete/[id].js";

function makeReqRes({ method, query = {}, body = {} }) {
  const req = httpMocks.createRequest({ method, query, body, headers: {} });
  const res = httpMocks.createResponse();
  return { req, res };
}

describe("pages/api/history and related tenant-scoped routes", () => {
  beforeEach(() => {
    resolveSiteFromRequest.mockReset();
    saveTranslation.mockReset();
    listTranslations.mockReset();
    deleteTranslation.mockReset();
    clearTranslations.mockReset();
  });

  describe("GET/POST/DELETE /api/history", () => {
    it("rejects all methods without a valid key", async () => {
      resolveSiteFromRequest.mockResolvedValue({ ok: false, reason: "invalid_api_key" });
      const { req, res } = makeReqRes({ method: "GET", query: { api_key: "bad" } });
      await historyHandler(req, res);
      expect(res.statusCode).toBe(401);
      expect(listTranslations).not.toHaveBeenCalled();
    });

    it("GET scopes the list query by the resolved site_id", async () => {
      resolveSiteFromRequest.mockResolvedValue({ ok: true, siteId: "site-1" });
      listTranslations.mockResolvedValue({ data: [], count: 0, total: 0, page: 1, limit: 10, totalPages: 0 });
      const { req, res } = makeReqRes({ method: "GET", query: { api_key: "wn_live_x", page: "1", limit: "10" } });
      await historyHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(listTranslations).toHaveBeenCalledWith(expect.objectContaining({ siteId: "site-1" }));
    });

    it("POST requires original_text/translated_text/target_language", async () => {
      resolveSiteFromRequest.mockResolvedValue({ ok: true, siteId: "site-1" });
      const { req, res } = makeReqRes({ method: "POST", body: { api_key: "wn_live_x" } });
      await historyHandler(req, res);
      expect(res.statusCode).toBe(400);
      expect(saveTranslation).not.toHaveBeenCalled();
    });

    it("POST saves scoped to the resolved site_id", async () => {
      resolveSiteFromRequest.mockResolvedValue({ ok: true, siteId: "site-1" });
      saveTranslation.mockResolvedValue({ saved: true, id: "hist-1" });
      const { req, res } = makeReqRes({
        method: "POST",
        body: { api_key: "wn_live_x", original_text: "hi", translated_text: "salut", target_language: "french" },
      });
      await historyHandler(req, res);
      expect(res.statusCode).toBe(201);
      expect(saveTranslation).toHaveBeenCalledWith(expect.objectContaining({ siteId: "site-1" }));
    });

    it("DELETE (clear-all via history route) only clears the resolved site_id", async () => {
      resolveSiteFromRequest.mockResolvedValue({ ok: true, siteId: "site-1" });
      clearTranslations.mockResolvedValue({ ok: true });
      const { req, res } = makeReqRes({ method: "DELETE", query: { api_key: "wn_live_x" } });
      await historyHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(clearTranslations).toHaveBeenCalledWith({ siteId: "site-1" });
    });
  });

  describe("DELETE /api/clearHistory", () => {
    it("requires a valid key", async () => {
      resolveSiteFromRequest.mockResolvedValue({ ok: false, reason: "invalid_api_key" });
      const { req, res } = makeReqRes({ method: "DELETE", query: {} });
      await clearHistoryHandler(req, res);
      expect(res.statusCode).toBe(401);
      expect(clearTranslations).not.toHaveBeenCalled();
    });

    it("only ever clears rows matching the resolved site_id (regression guard for the old delete-everything bug)", async () => {
      resolveSiteFromRequest.mockResolvedValue({ ok: true, siteId: "site-42" });
      clearTranslations.mockResolvedValue({ ok: true });
      const { req, res } = makeReqRes({ method: "DELETE", query: { api_key: "wn_live_x" } });
      await clearHistoryHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(clearTranslations).toHaveBeenCalledTimes(1);
      expect(clearTranslations).toHaveBeenCalledWith({ siteId: "site-42" });
    });
  });

  describe("DELETE /api/delete/[id]", () => {
    it("requires a valid key", async () => {
      resolveSiteFromRequest.mockResolvedValue({ ok: false, reason: "invalid_api_key" });
      const { req, res } = makeReqRes({ method: "DELETE", query: { id: "row-1" } });
      await deleteHandler(req, res);
      expect(res.statusCode).toBe(401);
      expect(deleteTranslation).not.toHaveBeenCalled();
    });

    it("requires a valid id", async () => {
      resolveSiteFromRequest.mockResolvedValue({ ok: true, siteId: "site-1" });
      const { req, res } = makeReqRes({ method: "DELETE", query: { api_key: "wn_live_x" } });
      await deleteHandler(req, res);
      expect(res.statusCode).toBe(400);
    });

    it("only deletes the row matching BOTH id and the resolved site_id (regression guard for cross-tenant deletes)", async () => {
      resolveSiteFromRequest.mockResolvedValue({ ok: true, siteId: "site-1" });
      deleteTranslation.mockResolvedValue({ ok: true });
      const { req, res } = makeReqRes({ method: "DELETE", query: { id: "row-1", api_key: "wn_live_x" } });
      await deleteHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(deleteTranslation).toHaveBeenCalledWith({ siteId: "site-1", id: "row-1" });
    });
  });
});
