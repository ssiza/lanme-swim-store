import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260625174211 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "support_ticket" ("id" text not null, "name" text not null, "email" text not null, "order_id" text null, "order_display_id" text null, "topic" text check ("topic" in ('order_issue', 'shipping', 'return_or_refund', 'damaged_item', 'wrong_item', 'product_question', 'other')) not null, "message" text not null, "status" text check ("status" in ('open', 'replied', 'closed')) not null default 'open', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "support_ticket_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_deleted_at" ON "support_ticket" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "support_ticket_reply" ("id" text not null, "ticket_id" text not null, "admin_user_id" text null, "message" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "support_ticket_reply_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_reply_deleted_at" ON "support_ticket_reply" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "support_ticket" cascade;`);

    this.addSql(`drop table if exists "support_ticket_reply" cascade;`);
  }

}
