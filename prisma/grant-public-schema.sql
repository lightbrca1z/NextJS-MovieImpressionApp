-- PostgreSQL 15 以降では public スキーマへの CREATE がデフォルトで制限されることがあり、
-- Prisma の db push で「permission denied for schema public」になる場合に実行してください。
--
-- スーパーユーザーで接続してから（例）:
--   psql -U postgres -d book_impression -f prisma/grant-public-schema.sql
--
-- ※ ユーザー名は .env の DATABASE_URL のユーザー（例: appuser）に合わせてください。

GRANT USAGE, CREATE ON SCHEMA public TO appuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO appuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO appuser;
