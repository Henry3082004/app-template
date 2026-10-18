# Kiểm thử cơ sở dữ liệu (chạy trên Postgres cục bộ, không đụng DB thật)

`00_local_base_schema.sql` dựng lại bảng cơ bản (dựng tay từ DB thật); `run.sh` áp dụng các migration theo đúng thứ tự và chạy các file kịch bản xen giữa.

```
PSQL="psql -h <máy-postgres> -p <cổng> -U postgres" ./run.sh
```
Script tạo một database thử mới, áp dụng lần lượt các migration và chạy từng file kịch bản; dừng ngay khi có lỗi.
Mỗi file kịch bản in ra một dòng `ALL … PASSED` là đạt. Lưu ý: file nền là bản dựng lại, có thể lệch DB thật ở chi tiết nhỏ.
