# دليل اختبار نظام تحليل التعليق الرياضي
## Testing Guide for Commentary Analysis System

## 🎯 Test Cases Overview

### 1. File Validation Tests

#### ✅ Valid Cases
- **Standard MP3 file (2-10 MB)**: Should process successfully
- **MP4 audio file**: Should process successfully
- **WAV file**: Should process successfully
- **M4A file**: Should process successfully
- **Arabic commentary**: Should transcribe and analyze correctly
- **Mixed Arabic/English commentary**: Should handle both languages

#### ❌ Invalid Cases & Expected Errors

| Test Case | Expected Error Message |
|-----------|----------------------|
| File > 25 MB | "حجم الملف يجب أن يكون أقل من 25 ميجابايت" |
| File < 10 KB | "الملف صغير جداً. يجب أن يكون أكبر من 10 كيلوبايت." |
| Empty/silent audio | "لم يتم العثور على محتوى صوتي في الملف. تأكد من وجود صوت واضح في التسجيل." |
| Corrupted audio file | "فشل في معالجة الملف الصوتي. تأكد من أن الملف صحيح وليس تالفاً." |
| Invalid file type (e.g., .txt, .pdf) | "نوع الملف غير مدعوم. الأنواع المدعومة: mp3, mp4, wav, m4a, webm" |
| Non-audio file with audio extension | "تنسيق الملف غير صحيح أو الملف تالف" |

### 2. Network & API Tests

#### ✅ Success Scenarios
- **Normal upload and analysis**: Should complete within 2-5 minutes
- **Large file (20+ MB)**: Should process with longer wait time
- **Retry after transient failure**: Should auto-retry up to 3 times
- **Network interruption during upload**: Should show retry attempt

#### ❌ Error Scenarios

| Test Case | Expected Behavior | Expected Error Message |
|-----------|------------------|----------------------|
| Network disconnected | Auto-retry 3 times, then fail | "فشل الاتصال بخدمة التحليل. تحقق من اتصالك بالإنترنت وحاول مرة أخرى." |
| API rate limit hit (429) | Show clear message | "تم تجاوز الحد الأقصى للطلبات. حاول مرة أخرى بعد دقيقة" |
| OpenAI server error (500+) | Show clear message | "خطأ في خادم OpenAI. حاول مرة أخرى لاحقاً" |
| Request timeout | Show clear message | "انتهت مهلة الطلب. الملف قد يكون كبيراً جداً." |

### 3. Data Validation Tests

#### ✅ Valid Analysis Response
The analysis must include:
- `overallScore`: Number between 1-10 (can be decimal like 6.5)
- `clarity`, `enthusiasm`, `accuracy`, `timing`, `terminology`, `eventReaction`, `styleVariety`: Non-empty strings
- `strengths`: Array with at least 1 item
- `improvements`: Array with at least 1 item
- `excitementTimeline`: Array with at least 1 item
- `emotionalAnalysis`: Object with 8 emotion fields
- `emotionalTimeline`: Array (optional)

#### ❌ Invalid Analysis Response
Should catch and report:
- Missing required fields
- Invalid data types (e.g., string instead of number)
- Empty arrays where data is required
- `overallScore` outside 0-10 range

### 4. Database Save Tests

#### ✅ Success Cases
- Analysis saved with all fields populated
- User can view saved analysis in history
- Sorting: Latest analysis appears first
- Transcription displays correctly (with or without segments)

#### ❌ Error Cases

| Test Case | Expected Error Message |
|-----------|----------------------|
| Not authenticated | "غير مصرح. يجب تسجيل الدخول أولاً" |
| Database connection failed | "تم إنشاء التحليل لكن فشل الحفظ في قاعدة البيانات" |
| Invalid user_id | "المستخدم غير مسجل الدخول" |

### 5. Edge Cases

#### ⚠️ Special Scenarios to Test

| Scenario | Expected Behavior |
|----------|------------------|
| Very short audio (< 5 seconds) | Should transcribe but may have minimal analysis |
| Very long audio (> 10 minutes) | May take longer; should still process |
| Audio with background noise | Should transcribe main speech; quality noted in analysis |
| Multiple languages mixed | Should handle but may note confusion in analysis |
| Poor audio quality | Should note clarity issues in analysis |
| Silence periods in audio | Should transcribe around silences |

### 6. UI/UX Tests

#### ✅ User Experience Checks
- Progress indicator shows during upload/analysis
- Clear error messages in Arabic
- Success notification on save
- Transcript displays properly
- Excel export works correctly
- Charts render properly
- Mobile responsive design works

## 🔍 Testing Checklist

### Pre-Deployment Testing
- [ ] Test with 5 different valid audio files
- [ ] Test with 3 different invalid file types
- [ ] Test with oversized file (> 25 MB)
- [ ] Test with very small file (< 10 KB)
- [ ] Test with corrupted audio file
- [ ] Test network retry mechanism (simulate disconnect)
- [ ] Test API error handling (check logs for proper error messages)
- [ ] Verify database saves work correctly
- [ ] Verify history page shows analyses
- [ ] Test Excel export with real data
- [ ] Test on mobile device
- [ ] Test in different browsers (Chrome, Safari, Firefox)

### New Format Testing (Criteria with Scores/Quotes)
- [ ] Verify all 7 criteria display with scores (0-10)
- [ ] Verify color-coded performance bars show correctly
- [ ] Verify explanations display for each criterion
- [ ] Verify supporting quotes display as bullet points
- [ ] Verify quotes are actual text from the commentary
- [ ] Test with missing criteria data (edge case handling)
- [ ] Test with invalid score values (< 0 or > 10)
- [ ] Test with empty quotes arrays
- [ ] Verify Excel export includes new format
- [ ] Verify saved analyses in history display correctly

### Post-Deployment Monitoring
- [ ] Check edge function logs for errors
- [ ] Monitor database for successful saves
- [ ] Track user-reported issues
- [ ] Monitor API usage and rate limits
- [ ] Check error rates in console logs
- [ ] Verify new analysis structure validation works
- [ ] Monitor for JSON parsing errors from AI model

## 📝 How to Report Issues

When reporting bugs, include:
1. **Test case that failed** (from above list)
2. **Expected behavior**
3. **Actual behavior**
4. **Error message** (exact text)
5. **Console logs** (from browser DevTools)
6. **Edge function logs** (if available)
7. **File details** (size, format, duration if known)

## 🛠️ Debugging Tools

### Frontend Console Logs
Look for these log patterns:
- `🚀 Calling analyze-commentary edge function (attempt X)...`
- `✅ Analysis completed successfully`
- `⚠️ Retrying analysis (attempt X/3)...`

### Edge Function Logs
Check Cloud → Edge Functions → analyze-commentary for:
- `=== Commentary Analysis Started ===`
- Step-by-step progress logs with timestamps
- Error logs with detailed information
- `=== Analysis Completed Successfully ===`

### Database Queries
```sql
-- Check recent analyses
SELECT id, filename, overall_score, created_at 
FROM commentary_analyses 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for failed saves
SELECT COUNT(*) as total_analyses
FROM commentary_analyses
WHERE created_at > NOW() - INTERVAL '1 day';
```

## 🔄 Continuous Improvement

After each test cycle:
1. Document any new edge cases discovered
2. Update error messages for clarity
3. Add validation for new scenarios
4. Improve retry logic if needed
5. Enhance user feedback based on confusion points
