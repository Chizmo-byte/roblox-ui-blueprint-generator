import { NextResponse } from "next/server";
import { parseImage } from "@/lib/image/parser";
import { parseDSLResponse } from "@/lib/dsl/parse";
import { callLLM } from "@/lib/llm/client";
import { LLMError } from "@/lib/llm/client";
import { RobloxUIRules } from "@/lib/roblox/rules";

export const runtime = "nodejs";

const errorResponses: Record<string, { message: string; status: number }> = {
  EMPTY_IMAGE: { message: "画像ファイルが空です。", status: 400 },
  IMAGE_TOO_LARGE: { message: "画像は5MB以下にしてください。", status: 400 },
  UNSUPPORTED_IMAGE_TYPE: { message: "PNGまたはJPEG形式の画像を選択してください。", status: 400 },
  INVALID_IMAGE_DATA: { message: "画像データを確認できませんでした。", status: 400 },
  INVALID_DSL: { message: "AIから有効なUI設計データを取得できませんでした。もう一度お試しください。（モデルの生の応答を開発サーバーのターミナルに出力しています）", status: 422 },
  AI_PROVIDER_NOT_CONFIGURED: { message: "APIキーが設定されていません。.env.local の LLM_API_KEY を設定してください。", status: 503 },
  AI_MODEL_NOT_CONFIGURED: { message: "使用するモデルが設定されていません。.env.local の LLM_MODEL を設定してください（例: gpt-4o-mini、gemini-3.6-flash、claude-haiku-4-5）。", status: 503 },
  AI_PROVIDER_INVALID: { message: "AIサービスの設定が正しくありません。LLM_PROVIDER（openai-compatible / anthropic）と LLM_BASE_URL の値を確認してください。", status: 503 },
  AI_AUTHENTICATION_FAILED: { message: "AIサービスの認証に失敗しました。APIキーを確認してください。", status: 502 },
  AI_RATE_LIMITED: { message: "AIサービスが混み合っているか、利用上限に達しています。少し待って再試行してください。", status: 429 },
  AI_MODEL_NOT_FOUND: { message: "指定されたモデルが見つかりません。LLM_MODEL と接続先URL（LLM_BASE_URL）の組み合わせが正しいか確認してください。", status: 502 },
  AI_REQUEST_FAILED: { message: "AIサービスがリクエストを受け付けませんでした。入力内容を確認して再試行してください。", status: 502 },
  AI_SERVICE_UNAVAILABLE: { message: "AIサービスに接続できません。時間をおいて再試行してください。", status: 503 },
  AI_INVALID_RESPONSE: { message: "AIから予期しない応答が返されました。再試行してください。", status: 502 },
  AI_REQUEST_TIMEOUT: { message: "AIサービスからの応答が時間切れになりました。再試行してください。", status: 504 },
};

export async function POST(request: Request) {
  // DSLの解析に失敗したとき、モデルが実際に何を返したかを診断できるよう保持する。
  let rawDsl: string | undefined;

  try {
    const formData = await request.formData();
    const formFile = formData.get("file");
    if (!(formFile instanceof File)) {
      return NextResponse.json({ error: "画像ファイルを選択してください。" }, { status: 400 });
    }

    const image = parseImage(Buffer.from(await formFile.arrayBuffer()), formFile.type);
    const userPromptValue = formData.get("userPrompt");
    const languageValue = formData.get("language");
    const userPrompt = typeof userPromptValue === "string" ? userPromptValue.slice(0, 2000) : "";
    const language = languageValue === "en" ? "en" : "ja";

    rawDsl = await callLLM({
      imageBase64: image.rawBase64,
      imageMimeType: image.mimeType,
      rules: RobloxUIRules,
      userPrompt,
      language,
    });

    return NextResponse.json({ dsl: parseDSLResponse(rawDsl) });
  } catch (error) {
    if (error instanceof LLMError) {
      console.error("LLM request failed", { code: error.code, status: error.status, detail: error.detail });
    }

    // モデルはJSONを返したが形式が合わなかった場合、生の応答をサーバー側のログに出す。
    // 原因の切り分けにはこれが最も有用で、ブラウザには送らないため安全。
    if (error instanceof Error && error.message === "INVALID_DSL" && rawDsl !== undefined) {
      console.error(
        "\n===== DSL解析に失敗しました。モデルの生の応答 =====\n" +
        rawDsl.slice(0, 5000) +
        (rawDsl.length > 5000 ? `\n…（全${rawDsl.length}文字のうち先頭5000文字）` : "") +
        "\n================================================\n",
      );
    }

    const response = error instanceof Error ? errorResponses[error.message] : undefined;
    const message = response?.message || "生成処理に失敗しました。";

    // 上流プロバイダのエラー本文を併記する。設定を行った本人が読むため、
    // こちらで推測した文言よりも原文のほうが原因究明に役立つ。
    const detail = error instanceof LLMError ? error.detail : undefined;

    return NextResponse.json(
      { error: detail ? `${message}\n\n詳細: ${detail}` : message },
      { status: response?.status || 500 },
    );
  }
}
