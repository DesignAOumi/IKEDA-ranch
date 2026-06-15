/**
 * 池田牧場 メール送信用 GASスクリプト
 *
 * Cloudflareアプリ（src/lib/email.ts）からPOSTを受け取り、
 * このスクリプトを所有するGoogleアカウントからメールを送信する。
 *
 * 【セットアップ】
 * 1. 池田牧場のGoogleアカウントでログインした状態で script.google.com を開く
 * 2. 新しいプロジェクトを作成し、このコードを貼り付ける
 * 3. 下の SECRET を推測されにくい文字列に変更する
 *    （この値を Cloudflare の環境変数 GAS_MAIL_SECRET にも同じものを設定）
 * 4. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 *    - 次のユーザーとして実行: 自分
 *    - アクセスできるユーザー: 全員
 * 5. 発行された「ウェブアプリのURL」を Cloudflare の環境変数 GAS_MAIL_URL に設定
 * 6. 初回デプロイ時にメール送信の権限承認を求められるので許可する
 */

// ↓ Cloudflare の GAS_MAIL_SECRET と必ず同じ値にする
const SECRET = 'ここに推測されにくい合言葉を設定';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.secret !== SECRET) {
      return json({ ok: false, error: 'unauthorized' });
    }
    if (!data.to || !data.subject) {
      return json({ ok: false, error: 'missing fields' });
    }

    MailApp.sendEmail({
      to: data.to,
      subject: data.subject,
      body: data.text || '',
      name: data.name || '池田牧場',
    });

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
