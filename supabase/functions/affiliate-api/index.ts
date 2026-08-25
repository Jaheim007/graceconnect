// ══════════════════════════════════════════════════════════════════════════
// SiteViral Affiliate Cloud — public API for external platforms
//
// Auth: Authorization: Bearer sv_live_...  (org API key, see api-keys-manage)
// Scopes: "read" for GET routes, "write" for mutations
//
// Routes (prefix /affiliate-api is stripped):
//   GET  /v1/programs
//   POST /v1/programs
//   POST /v1/programs/update
//   GET  /v1/ambassadors?program_id=
//   POST /v1/ambassadors
//   POST /v1/click                    (no API key — browser SDK, origin-checked)
//   POST /v1/conversions              (idempotent on external_reference)
//   POST /v1/conversions/reverse
//   GET  /v1/conversions?program_id=
//   GET  /v1/stats?program_id=
//   POST /v1/wallet/topup
// ══════════════════════════════════════════════════════════════════════════
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { authenticateApiKey, logApiRequest } from "../_shared/api-auth.ts";
import { clampPercent, resolveCommission, roundMoney } from "../_shared/commission-engine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, idempotency-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

function slugify(input: string): string {
  return input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "programme";
}

function randomCode(len = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes).map((b) => alphabet[b % alphabet.length]).join("");
}

function originAllowed(origin: string | null, allowed: string[] | null): boolean {
  if (!allowed || allowed.length === 0) return true; // not restricted
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  return allowed.some((a) => {
    const clean = String(a).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    return clean === host || host.endsWith(`.${clean}`);
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startedAt = Date.now();
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/affiliate-api/, "").replace(/\/+$/, "") || "/";
  const db = admin();

  try {
    // ────────────────────────────────────────────────────────────────
    // PUBLIC (no API key): browser click tracking from the SDK
    // ────────────────────────────────────────────────────────────────
    if (req.method === "POST" && path === "/v1/click") {
      const body = await req.json().catch(() => ({}));
      const programSlug = String(body.program ?? "").trim();
      const code = String(body.code ?? "").trim();
      if (!programSlug || !code) return json({ error: "program_and_code_required" }, 400);

      const { data: program } = await db.from("affiliate_programs")
        .select("id, allowed_origins, is_active")
        .eq("slug", programSlug)
        .maybeSingle();

      if (!program?.is_active) return json({ error: "program_not_found" }, 404);
      if (!originAllowed(req.headers.get("origin"), program.allowed_origins as string[])) {
        return json({ error: "origin_not_allowed" }, 403);
      }

      const { data: tracked } = await db.rpc("track_program_click", {
        _program_id: program.id,
        _code: code,
      });
      return json({ tracked: tracked === true });
    }

    // ────────────────────────────────────────────────────────────────
    // Everything below requires an org API key
    // ────────────────────────────────────────────────────────────────
    const needsWrite = req.method !== "GET";
    const auth = await authenticateApiKey(req, needsWrite ? "write" : "read");
    if (!auth.ok || !auth.context) {
      const status = auth.status ?? 401;
      await logApiRequest(null, req, path, status, startedAt);
      return json({ error: auth.error ?? "unauthorized" }, status);
    }
    const { orgId } = auth.context;

    /** Load a program and assert it belongs to the API key's organization. */
    const loadProgram = async (programId: string) => {
      const { data } = await db.from("affiliate_programs")
        .select("*")
        .eq("id", programId)
        .eq("owner_org_id", orgId)
        .maybeSingle();
      return data;
    };

    let response: Response;

    // ── Programs ─────────────────────────────────────────────────
    if (req.method === "GET" && path === "/v1/programs") {
      const { data, error } = await db.from("affiliate_programs")
        .select("*")
        .eq("owner_org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      response = json({ data });
    } else if (req.method === "POST" && path === "/v1/programs") {
      const body = await req.json().catch(() => ({}));
      const name = String(body.name ?? "").trim();
      if (!name) return json({ error: "name_required" }, 400);

      const baseSlug = slugify(String(body.slug ?? name));
      let slug = baseSlug;
      for (let i = 0; i < 5; i++) {
        const { data: clash } = await db.from("affiliate_programs")
          .select("id").eq("slug", slug).maybeSingle();
        if (!clash) break;
        slug = `${baseSlug}-${randomCode(4).toLowerCase()}`;
      }

      const payoutMode = body.payout_mode === "wallet" ? "wallet" : "reporting";
      const { data, error } = await db.from("affiliate_programs").insert({
        owner_org_id: orgId,
        name,
        slug,
        platform_url: body.platform_url ?? null,
        currency: String(body.currency ?? "XOF").toUpperCase(),
        default_commission_percent: clampPercent(body.default_commission_percent, 10),
        hold_days: Number.isFinite(Number(body.hold_days)) ? Number(body.hold_days) : 15,
        payout_mode: payoutMode,
        allowed_origins: Array.isArray(body.allowed_origins) ? body.allowed_origins : [],
      }).select().single();
      if (error) throw error;
      response = json({ data }, 201);
    } else if (req.method === "POST" && path === "/v1/programs/update") {
      const body = await req.json().catch(() => ({}));
      const program = await loadProgram(String(body.program_id ?? ""));
      if (!program) return json({ error: "program_not_found" }, 404);

      const patch: Record<string, unknown> = {};
      if (body.name != null) patch.name = String(body.name);
      if (body.platform_url != null) patch.platform_url = String(body.platform_url);
      if (body.currency != null) patch.currency = String(body.currency).toUpperCase();
      if (body.default_commission_percent != null) {
        patch.default_commission_percent = clampPercent(body.default_commission_percent, 10);
      }
      if (body.hold_days != null) patch.hold_days = Number(body.hold_days);
      if (body.payout_mode != null) {
        patch.payout_mode = body.payout_mode === "wallet" ? "wallet" : "reporting";
      }
      if (Array.isArray(body.allowed_origins)) patch.allowed_origins = body.allowed_origins;
      if (body.is_active != null) patch.is_active = !!body.is_active;

      const { data, error } = await db.from("affiliate_programs")
        .update(patch).eq("id", program.id).select().single();
      if (error) throw error;
      response = json({ data });

      // ── Ambassadors ────────────────────────────────────────────
    } else if (req.method === "GET" && path === "/v1/ambassadors") {
      const programId = url.searchParams.get("program_id") ?? "";
      const program = await loadProgram(programId);
      if (!program) return json({ error: "program_not_found" }, 404);
      const { data, error } = await db.from("affiliate_links")
        .select("id, code, user_id, clicks, conversions, total_earned, is_active, is_frozen, created_at")
        .eq("program_id", program.id)
        .order("created_at", { ascending: false })
        .limit(Math.min(Number(url.searchParams.get("limit") ?? 100), 500));
      if (error) throw error;
      response = json({ data });
    } else if (req.method === "POST" && path === "/v1/ambassadors") {
      const body = await req.json().catch(() => ({}));
      const program = await loadProgram(String(body.program_id ?? ""));
      if (!program) return json({ error: "program_not_found" }, 404);

      let userId: string | null = body.user_id ? String(body.user_id) : null;
      if (!userId && body.email) {
        const { data: found } = await db.rpc("find_user_id_by_email", { _email: String(body.email) });
        userId = (found as string | null) ?? null;
        if (!userId) {
          return json({
            error: "user_not_found",
            message: "L'ambassadeur doit d'abord créer un compte SiteViral (KYC + paiements).",
            signup_url: "https://siteviral.com/auth",
          }, 404);
        }
      }
      if (!userId) return json({ error: "user_id_or_email_required" }, 400);

      // Reuse an existing link for this ambassador on this program
      const { data: existing } = await db.from("affiliate_links")
        .select("id, code")
        .eq("program_id", program.id)
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) {
        response = json({ data: existing, existing: true });
      } else {
        let code = body.code ? slugify(String(body.code)).toUpperCase() : randomCode();
        for (let i = 0; i < 5; i++) {
          const { data: clash } = await db.from("affiliate_links")
            .select("id").eq("code", code).maybeSingle();
          if (!clash) break;
          code = randomCode();
        }
        const { data, error } = await db.from("affiliate_links").insert({
          organization_id: program.owner_org_id,
          program_id: program.id,
          user_id: userId,
          code,
          link_type: "program",
        }).select("id, code, user_id").single();
        if (error) throw error;
        response = json({ data }, 201);
      }

      // ── Conversions ────────────────────────────────────────────
    } else if (req.method === "POST" && path === "/v1/conversions") {
      const body = await req.json().catch(() => ({}));
      const program = await loadProgram(String(body.program_id ?? ""));
      if (!program) return json({ error: "program_not_found" }, 404);
      if (!program.is_active) return json({ error: "program_inactive" }, 403);

      const externalRef = String(
        body.external_reference ?? req.headers.get("idempotency-key") ?? "",
      ).trim();
      const amount = Number(body.amount);
      if (!externalRef) return json({ error: "external_reference_required" }, 400);
      if (!Number.isFinite(amount) || amount <= 0) return json({ error: "invalid_amount" }, 400);

      // Idempotency: same (program, external_reference) always returns the first result
      const { data: dupe } = await db.from("affiliate_conversions")
        .select("*")
        .eq("program_id", program.id)
        .eq("external_reference", externalRef)
        .maybeSingle();
      if (dupe) {
        response = json({ data: dupe, idempotent: true });
      } else {
        const code = String(body.code ?? "").trim();
        let link: Record<string, unknown> | null = null;
        if (code) {
          const { data } = await db.from("affiliate_links")
            .select("id, user_id, is_active, is_frozen")
            .eq("program_id", program.id)
            .eq("code", code)
            .maybeSingle();
          link = data;
        }

        const resolved = resolveCommission({
          amount,
          percent: body.commission_percent != null
            ? clampPercent(body.commission_percent)
            : clampPercent(program.default_commission_percent, 10),
          link: link as never,
          buyerUserId: body.buyer_user_id ?? null,
          enabled: true,
        });

        const currency = String(body.currency ?? program.currency).toUpperCase();
        const holdDays = Number(program.hold_days ?? 15);
        const payableAt = new Date(Date.now() + holdDays * 86400_000).toISOString();

        // Wallet mode → create a real SiteViral commission so the existing
        // payout + KYC pipeline handles the ambassador payment.
        let affiliateSaleId: string | null = null;
        let walletDebited = false;
        if (
          resolved.attributed && program.payout_mode === "wallet" &&
          resolved.commission_amount > 0
        ) {
          const balance = Number(program.wallet_balance ?? 0);
          if (balance < resolved.commission_amount) {
            return json({
              error: "insufficient_wallet_balance",
              wallet_balance: balance,
              required: resolved.commission_amount,
            }, 402);
          }
        }

        const { data: conversion, error: convErr } = await db.from("affiliate_conversions")
          .insert({
            program_id: program.id,
            affiliate_link_id: resolved.affiliate_link_id,
            affiliate_user_id: resolved.affiliate_user_id,
            external_reference: externalRef,
            external_customer_ref: body.customer_ref ?? null,
            amount: roundMoney(amount),
            currency,
            commission_percent: resolved.commission_percent,
            commission_amount: resolved.commission_amount,
            status: resolved.attributed ? "approved" : "unattributed",
            payable_at: resolved.attributed ? payableAt : null,
            metadata: {
              ...(typeof body.metadata === "object" && body.metadata ? body.metadata : {}),
              skipped_reason: resolved.skipped_reason ?? null,
              source: "affiliate_cloud",
            },
          })
          .select()
          .single();
        if (convErr) throw convErr;

        if (
          resolved.attributed && program.payout_mode === "wallet" &&
          resolved.commission_amount > 0
        ) {
          const { data: sale } = await db.from("affiliate_sales").insert({
            affiliate_link_id: resolved.affiliate_link_id,
            affiliate_user_id: resolved.affiliate_user_id,
            organization_id: program.owner_org_id,
            transaction_type: "external",
            transaction_id: conversion.id,
            gross_amount: roundMoney(amount),
            commission_amount: resolved.commission_amount,
            commission_percent: resolved.commission_percent,
            payable_at: payableAt,
          }).select("id").single();
          affiliateSaleId = sale?.id ?? null;

          const newBalance = roundMoney(
            Number(program.wallet_balance ?? 0) - resolved.commission_amount,
          );
          await db.from("affiliate_programs")
            .update({ wallet_balance: newBalance })
            .eq("id", program.id);
          await db.from("affiliate_program_wallet_ledger").insert({
            program_id: program.id,
            direction: "debit",
            amount: resolved.commission_amount,
            currency,
            balance_after: newBalance,
            reference: externalRef,
            note: "Commission ambassadeur",
          });
          walletDebited = true;

          if (affiliateSaleId) {
            await db.from("affiliate_conversions")
              .update({ affiliate_sale_id: affiliateSaleId })
              .eq("id", conversion.id);
          }
        }

        if (resolved.attributed && resolved.affiliate_link_id) {
          await db.rpc("increment_affiliate_link_stats", {
            _link_id: resolved.affiliate_link_id,
            _earned: resolved.commission_amount,
          }).then(() => {}, () => {});

          await db.from("user_notifications").insert({
            user_id: resolved.affiliate_user_id,
            organization_id: program.owner_org_id,
            title: `Commission ${program.name}`,
            body: `Vous avez gagné ${resolved.commission_amount.toLocaleString("fr-FR")} ${currency} via ${program.name}.`,
            notification_type: "commission",
          }).then(() => {}, () => {});
        }

        response = json({
          data: { ...conversion, affiliate_sale_id: affiliateSaleId, wallet_debited: walletDebited },
        }, 201);
      }
    } else if (req.method === "POST" && path === "/v1/conversions/reverse") {
      const body = await req.json().catch(() => ({}));
      const program = await loadProgram(String(body.program_id ?? ""));
      if (!program) return json({ error: "program_not_found" }, 404);

      const { data: conversion } = await db.from("affiliate_conversions")
        .select("*")
        .eq("program_id", program.id)
        .eq("external_reference", String(body.external_reference ?? ""))
        .maybeSingle();
      if (!conversion) return json({ error: "conversion_not_found" }, 404);
      if (conversion.status === "reversed") {
        response = json({ data: conversion, idempotent: true });
      } else {
        await db.from("affiliate_conversions").update({
          status: "reversed",
          reversed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", conversion.id);

        // Clawback: cancel the commission if it has not been paid yet
        if (conversion.affiliate_sale_id) {
          const { data: sale } = await db.from("affiliate_sales")
            .select("id, status, commission_amount")
            .eq("id", conversion.affiliate_sale_id)
            .maybeSingle();
          if (sale && sale.status !== "paid") {
            await db.from("affiliate_sales")
              .update({ status: "cancelled" })
              .eq("id", sale.id);
            const restored = roundMoney(
              Number(program.wallet_balance ?? 0) + Number(sale.commission_amount ?? 0),
            );
            await db.from("affiliate_programs")
              .update({ wallet_balance: restored })
              .eq("id", program.id);
            await db.from("affiliate_program_wallet_ledger").insert({
              program_id: program.id,
              direction: "credit",
              amount: Number(sale.commission_amount ?? 0),
              currency: conversion.currency,
              balance_after: restored,
              reference: conversion.external_reference,
              note: "Annulation de commission (remboursement)",
            });
          }
        }
        response = json({ ok: true, reversed: conversion.external_reference });
      }
    } else if (req.method === "GET" && path === "/v1/conversions") {
      const program = await loadProgram(url.searchParams.get("program_id") ?? "");
      if (!program) return json({ error: "program_not_found" }, 404);
      const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 200);
      const { data, error } = await db.from("affiliate_conversions")
        .select("*")
        .eq("program_id", program.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      response = json({ data });

      // ── Stats ──────────────────────────────────────────────────
    } else if (req.method === "GET" && path === "/v1/stats") {
      const program = await loadProgram(url.searchParams.get("program_id") ?? "");
      if (!program) return json({ error: "program_not_found" }, 404);

      const [{ data: links }, { data: conversions }] = await Promise.all([
        db.from("affiliate_links").select("clicks, conversions, total_earned")
          .eq("program_id", program.id),
        db.from("affiliate_conversions").select("amount, commission_amount, status")
          .eq("program_id", program.id),
      ]);

      const active = (conversions ?? []).filter((c) => c.status === "approved");
      response = json({
        data: {
          ambassadors: (links ?? []).length,
          clicks: (links ?? []).reduce((s, l) => s + Number(l.clicks ?? 0), 0),
          conversions: active.length,
          gross_volume: roundMoney(active.reduce((s, c) => s + Number(c.amount ?? 0), 0)),
          commissions_total: roundMoney(
            active.reduce((s, c) => s + Number(c.commission_amount ?? 0), 0),
          ),
          currency: program.currency,
          payout_mode: program.payout_mode,
          wallet_balance: Number(program.wallet_balance ?? 0),
        },
      });

      // ── Wallet ─────────────────────────────────────────────────
    } else if (req.method === "POST" && path === "/v1/wallet/topup") {
      const body = await req.json().catch(() => ({}));
      const program = await loadProgram(String(body.program_id ?? ""));
      if (!program) return json({ error: "program_not_found" }, 404);
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) return json({ error: "invalid_amount" }, 400);

      const newBalance = roundMoney(Number(program.wallet_balance ?? 0) + amount);
      await db.from("affiliate_programs")
        .update({ wallet_balance: newBalance }).eq("id", program.id);
      const { data, error } = await db.from("affiliate_program_wallet_ledger").insert({
        program_id: program.id,
        direction: "credit",
        amount: roundMoney(amount),
        currency: String(body.currency ?? program.currency).toUpperCase(),
        balance_after: newBalance,
        reference: body.reference ?? null,
        note: body.note ?? "Approvisionnement",
      }).select().single();
      if (error) throw error;
      response = json({ data, wallet_balance: newBalance }, 201);
    } else {
      response = json({ error: "not_found", path }, 404);
    }

    await logApiRequest(auth.context, req, path, response.status, startedAt);
    return response;
  } catch (e) {
    console.error("[affiliate-api]", e);
    return json({ error: e instanceof Error ? e.message : "internal" }, 500);
  }
});
