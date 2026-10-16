# Kiểm thử cơ sở dữ liệu (chạy trên Postgres cục bộ, không đụng DB thật)

`00_local_base_schema.sql` dựng lại bảng cơ bản (dựng tay từ DB thật), rồi áp dụng lần lượt hai migration và chạy `10_scenarios.sql`.

```
psql -f 00_local_base_schema.sql && psql -f ../migrations/20261016_escrow_reputation.sql \
  && psql -f ../migrations/20261017_admin_payouts.sql && psql -f ../migrations/20261018_reputation_integrity.sql && psql -f 10_scenarios.sql && psql -f 20_integrity.sql
```
Kết thúc bằng `ALL SCENARIOS PASSED` là đạt. Lưu ý: file nền là bản dựng lại, có thể lệch DB thật ở chi tiết nhỏ.
