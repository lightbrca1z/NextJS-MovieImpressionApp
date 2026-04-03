# Book Impression Web App

映画ごとに**日本語と英語の感想**を投稿・閲覧できる Next.js アプリです。ログインしたユーザーごとに投稿が紐づきます。

## 技術スタック

- **Next.js 15**（App Router）+ **React 19** + **TypeScript**
- **Tailwind CSS v4**（`globals.css` でレイアウト・コンポーネント用スタイル）
- **Prisma** + **PostgreSQL**（ユーザー・映画・感想）
- **NextAuth.js v5**（メール＋パスワードの Credentials 認証）
- **Stripe**（テスト用 Checkout サブスクリプション + Webhook）

## Stripe（テスト課金）

1. [Stripe ダッシュボード（テスト）](https://dashboard.stripe.com/test) で商品を作成し、**月額 500 円（JPY）** の定期 **Price** を追加する。  
2. `STRIPE_PRICE_ID`（`price_...`）と `STRIPE_SECRET_KEY` を `.env` に設定（キーは Git に含めない）。  
3. `NEXT_PUBLIC_APP_URL` を実際のオリジンに合わせる。  
4. ローカル Webhook: `stripe listen --forward-to localhost:3000/api/stripe/webhook` → 表示されたシークレットを `STRIPE_WEBHOOK_SECRET` に。  
5. イベント: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

**`/pricing`** → Checkout → **Webhook** で DB 更新後、映画追加・感想の**新規投稿**が可能。Stripe なしで開発する場合のみ `DISABLE_PAID_GATING=true`（本番禁止）。

## セットアップ

PostgreSQL でデータベースを用意します（例: `createdb book_impression`）。`.env` に `DATABASE_URL` を設定してください（`.env.example` 参照）。

```bash
cd BookImpressionWebApp-postgreSQL
npm install
npx prisma db push
npm run db:seed
npm run dev
```

`db push` で **`permission denied for schema public`** になる場合（PostgreSQL 15+ でよくある）は、DB を **`appuser` 所有者で作る**か、スーパーユーザーで次を実行してください。

```bash
# 例: postgres ユーザーで DB を作り直す（既存 DB を消す場合は注意）
createdb -O appuser book_impression
# または既存 DB の所有者を変更
# psql -U postgres -c 'ALTER DATABASE book_impression OWNER TO appuser;'
```

それでもダメなときは `prisma/grant-public-schema.sql` を `psql -U postgres -d book_impression -f prisma/grant-public-schema.sql` で流してください（ファイル内の `appuser` を `.env` のユーザー名に合わせて編集可）。

テーブル未作成で **`The table public.Movie does not exist`** となるときは、上記のあと **`npx prisma db push`** を再実行してください。

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

`.env` の `AUTH_SECRET` は本番では `openssl rand -base64 32` などで差し替えてください（`.env.example` 参照）。

## デモアカウント（シード後）

- **デモ:** `demo@example.com` / `demo1234`
- **テスト:** `test@test.com` / `test`（表示名 `test`）

**開発時（`next dev`）:** 上記デモ／テストユーザーが投稿した感想は、**別アカウントでログインしていても**映画ページで「編集」「削除」できます（学習用）。`next start`（本番相当）では無効。本番で同様にしたい場合のみ `.env` に `ALLOW_EDIT_SEED_REVIEWS=true`（非推奨）。

上記2ユーザーには「Night at the Museum」用のサンプル感想が1件ずつ入ります。さらに映画**test**（`/movies/test`）にデモユーザーの感想（タイトル・本文とも日英 `test`）が1件入り、ログイン後「自分の感想」で**編集・削除**を確認できます。

映画「Night at the Museum」に加え、`prisma/netflix-titles-data.ts` の **Netflix で配信されたことのある映画タイトル（数百件・重複除去後）** をシードします。網羅ではなく参考リストです。シード実行時に `night-museum` がDBに残っていれば削除されます。

## 主な画面

| パス | 内容 |
|------|------|
| `/` | トップ・映画一覧 |
| `/movies` | 映画一覧 |
| `/movies/[slug]` | 映画別・全ユーザーの感想（日英並列表示） |
| `/movies/new` | 映画追加（要ログイン・**月額 active/trialing**） |
| `/movies/[slug]/write` | 感想の新規投稿（同上） |
| `/login` / `/register` | ログイン・新規登録 |
| `/pricing` | 料金・Checkout（テスト） |
| `/billing/success` / `/billing/cancel` | Checkout 後の案内 |
