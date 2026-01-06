# 🧪 HƯỚNG DẪN TEST CÁC SERVICES

## 1. **Sidekiq - Background Jobs** ✅

### Test Sidekiq:
```bash
# 1. Start Redis server
redis-server

# 2. Start Sidekiq worker (trong terminal riêng)
cd backend
bundle exec sidekiq

# 3. Start Rails server (trong terminal riêng)
cd backend
bundle exec rails server

# 4. Test job bằng cách trigger một action có job:
# - Advance case đến Stage 5 sẽ trigger CaseExecutionSummaryJob
# - Check Sidekiq Web UI tại http://localhost:3000/sidekiq
# - Verify job xuất hiện trong queue và được process
# - Hoặc chạy code sau trong rails console
CaseExecutionSummaryJob.perform_later(@case.id)
```

### Verify trong Sidekiq Web UI:
- Vào `http://localhost:3000/sidekiq`
- Check tab "Busy" - jobs đang chạy
- Check tab "Retries" - jobs bị fail
- Check tab "Dead" - jobs bị fail nhiều lần
- Check "Stats" - số lượng jobs đã process

---

## 2. **AWS S3 - Cloud Storage** ✅

### Test S3 Upload (Production environment):

```ruby
# 1. Đảm bảo environment variables đã được set:
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY
# AWS_REGION
# AWS_S3_BUCKET  (QUAN TRỌNG: phải set biến này!)

# 2. Test bằng Rails console (production mode):
cd backend
RAILS_ENV=production bundle exec rails console

# 3. Test upload file:
# Tạo một test case (nếu chưa có)
case_record = Case.first

# Mở file để upload
file = File.open(Rails.root.join('spec', 'fixtures', 'files', 'test.txt'))

# Tạo CaseAttachment record trước
attachment = case_record.case_attachments.create!(
  stage: 1,
  attachment_type: 'test'
)

# Attach file vào attachment (cách đúng với ActiveStorage)
attachment.file.attach(
  io: file,
  filename: 'test.txt',
  content_type: 'text/plain'
)

# File được attached tự động khi gọi attach(), không cần save! lại

# Check file URL (S3 URL trong production)
attachment.file.url # Should return S3 URL (expires after 5 minutes by default)

# Hoặc get permanent URL (nếu cần)
# attachment.file.blob.service_url(expires_in: 1.hour)

# 4. Verify trên AWS Console:
# - Vào AWS S3 Console
# - Mở bucket đã config (AWS_S3_BUCKET)
# - Verify file đã được upload vào bucket

# 5. Verify trong database:
attachment.file.attached? # Should return true
attachment.file.filename # Should return 'test.txt'
attachment.file.byte_size # Should return file size
```

### Test Local Storage (Development):

```ruby
# Development sử dụng local storage (config/storage.yml - local)
# Files sẽ được lưu trong backend/storage/

cd backend
bundle exec rails console

case_record = Case.first

# Mở file để upload
file = File.open(Rails.root.join('spec', 'fixtures', 'files', 'test.txt'))

# Tạo CaseAttachment record trước
attachment = case_record.case_attachments.create!(
  stage: 1,
  attachment_type: 'test'
)

# Attach file vào attachment
attachment.file.attach(
  io: file,
  filename: 'test.txt',
  content_type: 'text/plain'
)

# Check file path (local path trong development)
attachment.file.path # Should return local path: .../storage/xx/yy/...

# Verify file tồn tại
File.exist?(attachment.file.path) # Should return true

# Check file URL (local URL)
attachment.file.url # Should return local URL
```

---

## 3. **Redis - Cache & Rate Limiting** ✅

### Test Redis Cache:

```bash
# 1. Đảm bảo Redis đang chạy
redis-cli ping # Should return PONG

# 2. Test cache trong Rails console:
cd backend
bundle exec rails console

# Test cache
Rails.cache.write('test_key', 'test_value', expires_in: 1.hour)
Rails.cache.read('test_key') # Should return 'test_value'

# Check trong Redis
redis-cli
> GET furnicare:cache:test_key

# Test cache trong production
RAILS_ENV=production bundle exec rails console
Rails.cache.write('test', 'value')
Rails.cache.read('test')
```

### Test Rate Limiting (Rack::Attack):

```bash
# 1. Start Rails server
cd backend
bundle exec rails server

# 2. Test rate limit bằng cách gửi nhiều requests:

# Test login rate limit (5 requests per 20 minutes in production):
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
done

# Request thứ 6 nên trả về 429 (Too Many Requests)

# Test general rate limit (100 requests per minute):
# Sử dụng tool như Apache Bench hoặc viết script:
ab -n 110 -c 10 http://localhost:3000/api/cases

# Check logs để xem rate limit warnings
tail -f log/development.log | grep Rack::Attack
```

### Verify Redis Keys:

```bash
redis-cli

# List all keys
> KEYS *

# Check rate limit keys
> KEYS *rack_attack*

# Check cache keys
> KEYS *cache*

# Get specific key value
> GET furnicare:rack_attack:logins/ip:127.0.0.1
```

---

## 4. **New Relic - Monitoring** ✅

### Test Backend (Rails):

```bash
# 1. Đảm bảo environment variables:
# NEW_RELIC_LICENSE_KEY
# NEW_RELIC_APP_NAME

# 2. Start Rails server với production mode (hoặc development với config phù hợp)
RAILS_ENV=production bundle exec rails server

# 3. Generate một số requests:
curl http://localhost:3000/api/health
curl http://localhost:3000/api/cases

# 4. Check New Relic Dashboard:
# - Vào https://one.newrelic.com
# - Chọn ứng dụng của bạn
# - Verify metrics xuất hiện trong "APM & Services"
# - Check "Transactions" để xem request details
```

### Test Frontend (Browser):

```bash
# 1. Đảm bảo environment variables trong frontend/.env:
# VITE_NEW_RELIC_LICENSE_KEY
# VITE_NEW_RELIC_APP_ID
# VITE_NEW_RELIC_ACCOUNT_ID

# 2. Build và start frontend:
cd frontend
npm run build
npm run preview

# 3. Open browser và navigate đến app
# 4. Check browser console - không nên có errors
# 5. Check New Relic Dashboard:
# - Vào https://one.newrelic.com
# - Chọn "Browser" trong menu
# - Verify page views và performance metrics
```

### Verify New Relic Agent:

```ruby
# Rails console - check agent status
cd backend
bundle exec rails console

# Check if New Relic is loaded
defined?(NewRelic) # Should return "constant"

# Check agent configuration
NewRelic::Agent.config[:app_name] # Should return your app name
NewRelic::Agent.config[:license_key].present? # Should return true
```

---

## 5. **Sentry - Error Tracking** ✅

### Test Backend Error Tracking:

```ruby
# 1. Đảm bảo SENTRY_DSN đã được set

# 2. Trigger một error trong Rails console:
cd backend
bundle exec rails console

# Test error tracking
begin
  raise StandardError, "Test error for Sentry"
rescue => e
  ErrorTracker.capture_exception(e)
end

# Hoặc trigger error trong controller:
# Trong một API endpoint, thêm: raise "Test error"
```

### Test Frontend Error Tracking:

```javascript
// Trong browser console:
// Test error tracking
throw new Error('Test error for Sentry')

// Check Sentry Dashboard:
// - Vào https://sentry.io
// - Chọn project của bạn
// - Verify error xuất hiện trong "Issues"
```

### Verify Sentry Configuration:

```ruby
# Rails console
cd backend
bundle exec rails console

# Check if Sentry is configured
Sentry.configuration.dsn # Should return your DSN
Sentry.configuration.environment # Should return current environment
```

---

## 📝 GHI CHÚ QUAN TRỌNG

1. **Environment Variables**: Đảm bảo tất cả environment variables đã được set trong `.env` file
   - **AWS S3**: Cần set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, và **`AWS_S3_BUCKET`** (QUAN TRỌNG!)
   - Nếu thiếu `AWS_S3_BUCKET`, sẽ gặp lỗi "missing required option :name"
2. **Redis**: Redis phải chạy trước khi start Sidekiq và Rails server
3. **AWS Credentials**: Cần valid AWS credentials để test S3
4. **Network**: Các external services (Sentry, New Relic, AWS) cần internet connection
5. **Production vs Development**: 
   - S3 chỉ hoạt động trong production mode (config `active_storage.service = :amazon`)
   - Development mode sử dụng local storage (files trong `backend/storage/`)
6. **ActiveStorage Attach**: 
   - Phải tạo `CaseAttachment` record trước bằng `case_record.case_attachments.create!()`
   - Sau đó mới attach file vào `attachment.file.attach()`
   - File path trong test fixtures: `spec/fixtures/files/test.txt` (KHÔNG phải `test/fixtures/files/test.txt`)

