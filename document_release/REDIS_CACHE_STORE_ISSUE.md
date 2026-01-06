# ⚠️ Redis Cache Store Issue

## Vấn đề

Khi chạy Rails console hoặc server trong production mode với `config.cache_store = :redis_cache_store`, gặp lỗi:

```
connection_pool.rb:48:in `initialize': wrong number of arguments (given 1, expected 0) (ArgumentError)
```

## Nguyên nhân

Có vấn đề tương thích giữa:
- Rails 7.1.6
- `connection_pool` gem 3.0.2
- `redis_cache_store` trong ActiveSupport

## Giải pháp tạm thời

Đã tạm thời disable Redis cache store và sử dụng `memory_store` trong `config/environments/production.rb`.

## Giải pháp vĩnh viễn (cần nghiên cứu thêm)

Các options để fix:

1. **Update connection_pool gem:**
   ```bash
   bundle update connection_pool
   ```

2. **Downgrade connection_pool gem:**
   - Có thể cần pin version cụ thể tương thích với Rails 7.1

3. **Sử dụng Redis cache store với cấu hình khác:**
   - Thử cách config Redis cache store khác
   - Có thể cần config pool settings khác đi

4. **Chờ Rails/Ruby gem update:**
   - Issue này có thể đã được fix trong Rails 7.2 hoặc gem mới hơn

## Workaround hiện tại

- Cache store: `:memory_store` (trong production.rb)
- Sidekiq: Vẫn hoạt động bình thường với Redis (không bị ảnh hưởng)
- Rack::Attack: Vẫn hoạt động bình thường với Redis (không bị ảnh hưởng)

## Impact

- **Cache:** Không sử dụng Redis cache, chỉ dùng memory store (không persist giữa các restart)
- **Sidekiq:** ✅ Không bị ảnh hưởng
- **Rate Limiting:** ✅ Không bị ảnh hưởng

## Next Steps

1. Test xem Rails console có chạy được không (với memory_store)
2. Nghiên cứu cách fix connection_pool compatibility
3. Test với connection_pool version khác
4. Check Rails 7.2 hoặc gem updates

