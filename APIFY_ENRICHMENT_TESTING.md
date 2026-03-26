# Apify LinkedIn Profile Enrichment - Testing Guide

## Overview
This document outlines test cases and procedures for the LinkedIn profile enrichment feature using the Apify `dev_fusion~linkedin-profile-scraper` actor.

## Prerequisites
- APIFY_API_TOKEN configured in environment variables
- Valid LinkedIn profile URLs
- Candidates search functionality working

## Test Cases

### 1. Basic Enrichment Test
**Objective**: Verify that profile enrichment works for a single batch of candidates.

**Input**:
- Perform a LinkedIn search that returns 1-10 candidates
- Ensure APIFY_API_TOKEN is configured

**Expected Results**:
- Apify API is called with correct endpoint
- Enriched profile data is stored in `enriched_profile` column
- Candidate names are updated with full names from enriched data
- Console logs show: "Successfully enriched: X profiles"

**Verification**:
```sql
SELECT name, enriched_profile->>'fullName' as full_name, 
       enriched_profile->>'headline' as headline,
       enriched_profile IS NOT NULL as has_enrichment
FROM candidates 
WHERE search_id = '<search_id>'
ORDER BY created_at DESC;
```

---

### 2. Batch Processing Test
**Objective**: Verify that large result sets are processed in batches of 10.

**Input**:
- Perform a search that returns 20+ candidates

**Expected Results**:
- Profiles are enriched in batches of 10
- Console logs show "Enriching batch 1 of X", "Enriching batch 2 of X", etc.
- All batches complete successfully
- Total enriched count matches candidate count (minus any failures)

**Verification**:
- Check Edge Function logs for batch processing messages
- Verify database has enriched data for all candidates

---

### 3. API Error Handling Test
**Objective**: Verify graceful handling of Apify API errors.

**Test Scenarios**:

#### 3.1. Invalid API Token
**Input**: Temporarily use invalid APIFY_API_TOKEN

**Expected Results**:
- Error logged: "Apify API error (401)" or similar
- Search continues without enrichment
- Candidates are still saved with basic information
- Function returns success (enrichment is optional)

#### 3.2. Network Timeout
**Expected Results**:
- Timeout after 2 minutes per batch
- Error logged with timeout message
- Remaining batches continue to process
- Partial enrichment data is saved

#### 3.3. Rate Limiting
**Expected Results**:
- 429 status code logged
- Batch marked as failed
- Other batches continue processing

---

### 4. Data Validation Test
**Objective**: Verify enriched profile data structure and content.

**Expected Fields in enriched_profile**:
- `fullName`, `firstName`, `lastName`
- `headline`
- `profilePic`, `backgroundPic`
- `connections`, `followers`
- `experiences` (array)
- `skills` (array)
- `educations` (array)
- `languages` (array)
- `about`
- `linkedinUrl`, `linkedinPublicUrl`

**Verification**:
```sql
SELECT 
  name,
  enriched_profile->>'fullName' as full_name,
  enriched_profile->>'headline' as headline,
  jsonb_array_length(enriched_profile->'experiences') as experience_count,
  jsonb_array_length(enriched_profile->'skills') as skills_count,
  enriched_profile->>'connections' as connections
FROM candidates 
WHERE enriched_profile IS NOT NULL
LIMIT 5;
```

---

### 5. URL Matching Test
**Objective**: Verify profile matching works with different URL formats.

**URL Formats to Test**:
- `https://www.linkedin.com/in/username/`
- `https://linkedin.com/in/username`
- `https://www.linkedin.com/in/username`
- URLs with tracking parameters

**Expected Results**:
- All URL formats match correctly
- Enriched data is associated with correct candidate
- No duplicate or missing matches

---

### 6. Missing Token Test
**Objective**: Verify behavior when APIFY_API_TOKEN is not configured.

**Input**: Remove or unset APIFY_API_TOKEN

**Expected Results**:
- Console log: "Skipping profile enrichment - APIFY_API_TOKEN not configured"
- Search completes successfully
- Candidates saved without enriched_profile data
- No errors thrown

---

### 7. Empty Results Test
**Objective**: Verify handling when search returns no candidates.

**Input**: Perform a search with very specific criteria that returns 0 results

**Expected Results**:
- Console log: "Skipping profile enrichment - no candidates to enrich"
- Function returns empty candidates array
- No Apify API calls made

---

### 8. Partial Enrichment Failure Test
**Objective**: Verify that if some profiles fail enrichment, others still succeed.

**Expected Results**:
- Successful enrichments are saved
- Failed profiles logged with specific errors
- Console shows counts: "Successfully enriched: X profiles, Failed: Y profiles"
- Function completes successfully

---

### 9. Profile Update Test
**Objective**: Verify that candidate names are updated from enriched data.

**Expected Results**:
- Original name from SerpAPI snippet is replaced
- Full name from Apify is used (e.g., "Ahmed R. Al-Atwan" instead of "Ahmed")
- Database reflects updated names

**Verification**:
```sql
SELECT 
  name as current_name,
  profile_summary,
  enriched_profile->>'fullName' as enriched_name
FROM candidates
WHERE enriched_profile IS NOT NULL
LIMIT 10;
```

---

### 10. Concurrent Search Test
**Objective**: Verify that multiple searches don't interfere with each other.

**Input**: Trigger two searches simultaneously

**Expected Results**:
- Both searches complete successfully
- Each search has its own batch processing
- No data cross-contamination between searches
- Enrichment data associates with correct search_id

---

## Performance Benchmarks

| Metric | Target | Acceptable |
|--------|--------|------------|
| Enrichment per profile | < 10s | < 15s |
| Batch of 10 profiles | < 60s | < 120s |
| 20 profiles (2 batches) | < 120s | < 240s |
| Database update per profile | < 100ms | < 500ms |

---

## Error Codes Reference

| Error Code | Meaning | Expected Handling |
|------------|---------|-------------------|
| 400 | Bad Request | Log error, skip batch |
| 401 | Unauthorized | Log error, skip enrichment |
| 403 | Forbidden | Log error, skip enrichment |
| 404 | Actor not found | Log error, skip enrichment |
| 429 | Rate limited | Log error, retry or skip |
| 500 | Server error | Log error, skip batch |
| Timeout | Network timeout | Log error, skip batch |

---

## Debugging Checklist

When enrichment fails, check:

1. **Environment Variable**
   - [ ] APIFY_API_TOKEN is set
   - [ ] Token is valid and not expired

2. **API Connectivity**
   - [ ] Can reach api.apify.com
   - [ ] No network/firewall issues
   - [ ] DNS resolution working

3. **Actor Status**
   - [ ] `dev_fusion~linkedin-profile-scraper` actor exists
   - [ ] Actor is not deprecated or disabled
   - [ ] Correct actor name in code

4. **Data Format**
   - [ ] profileUrls array is properly formatted
   - [ ] URLs are valid LinkedIn profile URLs
   - [ ] Response matches expected schema

5. **Database**
   - [ ] enriched_profile column exists
   - [ ] Column type is jsonb
   - [ ] No RLS policy blocking updates

6. **Logs**
   - [ ] Check Edge Function logs for detailed errors
   - [ ] Look for timeout messages
   - [ ] Check batch processing logs

---

## Manual Testing Procedure

### Step 1: Verify Setup
```bash
# Check environment variable (in Supabase Edge Function settings)
echo $APIFY_API_TOKEN
```

### Step 2: Perform Search
1. Navigate to Candidate Hunter page
2. Fill in search form with test criteria
3. Submit search
4. Monitor browser console and network tab

### Step 3: Check Logs
```sql
-- View Edge Function logs in Supabase dashboard
-- Look for:
-- "Starting profile enrichment with Apify..."
-- "Enriching batch X of Y"
-- "Successfully enriched: X profiles"
```

### Step 4: Verify Data
```sql
-- Check enrichment results
SELECT 
  id,
  name,
  linkedin_url,
  enriched_profile IS NOT NULL as has_enrichment,
  enriched_profile->>'fullName' as enriched_name,
  created_at
FROM candidates
ORDER BY created_at DESC
LIMIT 20;
```

### Step 5: Test Error Scenarios
- Temporarily break APIFY_API_TOKEN
- Use invalid LinkedIn URLs
- Trigger timeout with large batch

---

## Success Criteria

A successful test session should demonstrate:

- ✅ Basic enrichment works for small result sets (1-10 candidates)
- ✅ Batch processing works for larger result sets (20+ candidates)
- ✅ API errors are handled gracefully without breaking the search
- ✅ Enriched data is properly stored in database
- ✅ Candidate names are updated from enriched data
- ✅ Missing token scenario is handled correctly
- ✅ Performance meets acceptable benchmarks
- ✅ Logs provide clear debugging information

---

## Common Issues and Solutions

### Issue: No enrichment happening
**Solution**: 
- Verify APIFY_API_TOKEN is set
- Check Edge Function logs for errors
- Confirm actor name is correct

### Issue: Timeout errors
**Solution**:
- Reduce batch size from 10 to 5
- Increase timeout from 120s to 180s
- Check Apify service status

### Issue: Name not updating
**Solution**:
- Verify enriched_profile has fullName field
- Check fallback logic (firstName + lastName)
- Ensure database update succeeds

### Issue: Partial failures
**Solution**:
- Review individual profile errors in logs
- Check if specific LinkedIn URLs are problematic
- Verify URL matching logic

---

## Test Report Template

```
Test Session: [Date/Time]
Tester: [Name]
Environment: [Production/Staging]

### Tests Passed: X/10
- [ ] Basic Enrichment Test
- [ ] Batch Processing Test
- [ ] API Error Handling Test
- [ ] Data Validation Test
- [ ] URL Matching Test
- [ ] Missing Token Test
- [ ] Empty Results Test
- [ ] Partial Enrichment Failure Test
- [ ] Profile Update Test
- [ ] Concurrent Search Test

### Bugs Found:
1. [Description]
2. [Description]

### Performance Results:
- Average enrichment time per profile: Xs
- Batch processing time: Xs
- Database update time: Xms

### Notes:
[Additional observations]

### Overall Assessment:
[Pass/Fail with reasoning]
```
