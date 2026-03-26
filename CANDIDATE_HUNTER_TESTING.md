# LinkedIn Candidates Hunter - Testing Guide

## Overview
This guide covers comprehensive testing for the LinkedIn Candidates Hunter tool that searches for candidates on LinkedIn using SerpAPI and analyzes them using AI.

## Prerequisites
- Valid SerpAPI API key configured
- Valid OpenRouter API key configured
- Authenticated user session
- Active internet connection

---

## Test Cases

### 1. Basic Search Functionality

#### Test 1.1: Simple Job Title Search
**Input:**
- Job Title: "software engineer"
- City: "Riyadh"
- Companies: (empty)

**Expected Result:**
- Search query constructed correctly
- SerpAPI returns results
- Candidates displayed with LinkedIn profiles
- AI analysis includes scores, strengths, and gaps

**Verification:**
- Check console logs for search query
- Verify candidate cards show correct information
- Confirm AI scores are between 0-10

#### Test 1.2: Search with Multiple Companies
**Input:**
- Job Title: "technical recruiter"
- City: "Jeddah"
- Companies: ["Google", "Microsoft", "Amazon"]

**Expected Result:**
- Search query includes all companies with OR operator
- Results show candidates from specified companies
- Company badges displayed in search history

**Verification:**
- Check constructed query in logs: `(("Google" OR "Microsoft" OR "Amazon"))`
- Verify candidates match company criteria

#### Test 1.3: Search with Arabic City Names
**Input:**
- Job Title: "data scientist"
- City: "الرياض"
- Companies: (empty)

**Expected Result:**
- Search handles Arabic characters correctly
- Results returned for Saudi locations
- No encoding errors

---

### 2. Pagination & Load More

#### Test 2.1: Load More Results
**Action:**
1. Perform initial search
2. Scroll to bottom
3. Click "Load More" button

**Expected Result:**
- Additional 20 candidates loaded
- No duplicate candidates
- Load More button updates or disappears when no more results

**Verification:**
- Check candidates array length increases
- Verify unique candidate IDs
- Confirm nextPage parameter used correctly

#### Test 2.2: Pagination State Management
**Action:**
1. Load 3 pages of results (60 candidates)
2. Mark some as qualified
3. Refresh page
4. Check history

**Expected Result:**
- All 60 candidates saved to database
- Status preserved for marked candidates
- Search shows correct total results count

---

### 3. AI Analysis Testing

#### Test 3.1: Score Accuracy
**Expected Behavior:**
- Scores range from 0-10 (decimals allowed)
- Higher scores for better matches
- Scores consistent with qualitative assessment

**Verification:**
- Check that score aligns with strengths/gaps
- Verify score displayed correctly (X.X/10 format)

#### Test 3.2: Qualitative Analysis
**Expected Content:**
- 2-3 strengths listed as bullet points
- 1-2 gaps or concerns identified
- 2-3 sentence overall assessment
- Analysis relevant to Thamanyah context (VC/investment firm)

**Keywords to Look For:**
- "venture capital", "investment", "finance"
- "Saudi Arabia", location mentions
- "leadership", "strategic thinking"
- Specific technical or domain skills

#### Test 3.3: Fallback Behavior
**Simulate:** AI API failure or invalid response

**Expected Result:**
- Candidates still saved with default analysis
- Score defaults to 5
- Generic message: "AI analysis unavailable. Please review manually."
- No application crash

---

### 4. Candidate Status Management

#### Test 4.1: Mark as Qualified
**Action:**
1. Click "مؤهل" (Qualified) button on candidate

**Expected Result:**
- Status badge turns green
- Button styling changes to show active state
- Database updated immediately
- Status persists after page refresh

#### Test 4.2: Mark as Not Qualified
**Action:**
1. Click "غير مؤهل" (Not Qualified) button

**Expected Result:**
- Status badge turns red
- Button shows active state
- Change saved to database
- History page reflects new status

#### Test 4.3: Toggle Status
**Action:**
1. Mark candidate as Qualified
2. Then mark as Not Qualified
3. Check history

**Expected Result:**
- Status updates correctly each time
- Latest status shown in history
- updated_at timestamp changes

---

### 5. Comments & Notes

#### Test 5.1: Add Comment
**Action:**
1. Type comment in textarea
2. Wait for auto-save (on blur)

**Expected Result:**
- Comment saved to database
- Toast notification shown
- Comment preserved on refresh

#### Test 5.2: Long Comment
**Input:** 500+ character comment

**Expected Result:**
- Full comment saved without truncation
- Textarea expands appropriately
- No character limit errors

#### Test 5.3: Special Characters
**Input:** Comment with emojis, Arabic, and special chars: "مرشح ممتاز 👍 @mention #hashtag"

**Expected Result:**
- All characters saved correctly
- No encoding issues
- Displays properly in history

---

### 6. Search History

#### Test 6.1: View Past Searches
**Action:**
1. Perform 3 different searches
2. Navigate to History page

**Expected Result:**
- All 3 searches listed chronologically
- Each shows: job title, city, companies, date
- Candidate counts displayed (qualified/not qualified/pending)

#### Test 6.2: Delete Search
**Action:**
1. Click trash icon on search
2. Confirm deletion

**Expected Result:**
- Search removed from list
- Associated candidates also deleted (cascade)
- Toast confirmation shown

#### Test 6.3: Export to Excel
**Action:**
1. Click download icon on search
2. Open downloaded Excel file

**Expected Columns:**
- Name, Score, Status, Assessment
- Strengths, Gaps, Comments
- LinkedIn URL

**Verification:**
- File named correctly: `candidates_{job_title}_{city}_{date}.xlsx`
- All candidate data present
- Arabic text displays correctly in Excel

---

### 7. Candidate Filtering

#### Test 7.1: Filter by Status
**Action:**
1. Click each status filter tab
   - All
   - Qualified
   - Not Qualified  
   - Pending

**Expected Result:**
- Candidate list updates to show only matching status
- Count badges show correct numbers
- No candidates lost when switching filters

#### Test 7.2: Empty Filter Results
**Scenario:** No qualified candidates yet

**Action:**
1. Click "Qualified" filter

**Expected Result:**
- Empty state message shown
- No error thrown
- Other filters still work

---

### 8. Error Handling

#### Test 8.1: Missing Required Fields
**Action:**
1. Leave job title empty
2. Click search

**Expected Result:**
- Error toast: "يرجى إدخال المسمى الوظيفي والمدينة"
- No API calls made
- Form validation prevents submission

#### Test 8.2: SerpAPI Failure
**Simulate:** Invalid API key or rate limit

**Expected Result:**
- Error logged to console
- User-friendly error message
- No partial data saved
- App remains functional

#### Test 8.3: OpenRouter AI Failure
**Simulate:** API timeout or error

**Expected Result:**
- Candidates still saved with fallback analysis
- Console error logged
- User can still use candidates
- Manual review possible

#### Test 8.4: Network Interruption
**Action:**
1. Start search
2. Disconnect internet mid-request

**Expected Result:**
- Error caught gracefully
- Error message displayed
- No corrupt data in database
- Can retry after reconnecting

---

### 9. Authentication & Authorization

#### Test 9.1: Unauthenticated Access
**Action:**
1. Log out
2. Try to access /candidate-hunter

**Expected Result:**
- Edge function returns 401 error
- Redirected to login page
- No data exposed

#### Test 9.2: RLS Policy Verification
**Action:**
1. Create search as User A
2. Log in as User B
3. Check history

**Expected Result:**
- User B cannot see User A's searches
- User B cannot access User A's candidates
- Database queries filtered by user_id

---

### 10. Performance Testing

#### Test 10.1: Large Result Set
**Action:**
1. Search for common role: "software engineer" in "Saudi Arabia"
2. Load 100+ candidates across multiple pages

**Expected Result:**
- Each page loads within 5 seconds
- UI remains responsive
- No memory leaks
- Database writes complete successfully

#### Test 10.2: Concurrent Searches
**Action:**
1. Open 2 browser tabs
2. Start different searches simultaneously

**Expected Result:**
- Both searches complete independently
- No race conditions
- Each search saved with correct data

---

### 11. UI/UX Testing

#### Test 11.1: Responsive Design
**Test on:**
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

**Expected Result:**
- All elements visible and functional
- No horizontal scrolling
- Buttons accessible
- Cards stack properly on mobile

#### Test 11.2: Arabic RTL Support
**Verification:**
- All Arabic text aligned right
- Icons positioned correctly for RTL
- Form layouts mirror properly
- No text overflow

#### Test 11.3: Loading States
**Check:**
- Search button shows "جاري البحث..." during search
- Load More button shows "جاري التحميل..."
- Spinners or skeleton loaders shown appropriately
- Buttons disabled during operations

---

### 12. Edge Cases

#### Test 12.1: No Search Results
**Input:**
- Very specific search unlikely to return results
- Job Title: "underwater basket weaver"
- City: "Riyadh"

**Expected Result:**
- Message: "لم يتم العثور على مرشحين يطابقون البحث"
- No empty cards displayed
- Can start new search immediately

#### Test 12.2: Special Characters in Input
**Input:**
- Job Title: "C++ / .NET developer"
- City: "Al-Khobar"
- Company: "AT&T"

**Expected Result:**
- Special characters handled in URL encoding
- Search executes without errors
- Results returned correctly

#### Test 12.3: Very Long Company Names
**Input:**
- Add company: "Saudi Arabian Military Industries Corporation (SAMI)"

**Expected Result:**
- Badge displays without breaking layout
- Full name preserved in database
- Searchable in query

---

## Performance Benchmarks

### API Response Times
- SerpAPI call: < 3 seconds
- OpenRouter AI analysis: < 10 seconds (for 20 candidates)
- Database save: < 1 second
- **Total search time: 10-15 seconds**

### Load More Performance
- Additional page load: < 5 seconds
- UI update: < 500ms

### Excel Export
- 50 candidates: < 2 seconds
- 200 candidates: < 5 seconds

---

## Database Verification

### After Each Test Session
```sql
-- Check searches saved
SELECT COUNT(*) FROM candidate_searches WHERE user_id = 'test-user-id';

-- Check candidates saved
SELECT COUNT(*) FROM candidates WHERE user_id = 'test-user-id';

-- Verify RLS
SELECT * FROM candidates WHERE user_id != 'test-user-id'; -- Should return 0

-- Check data integrity
SELECT 
  c.name,
  c.status,
  c.ai_analysis->'score' as score,
  LENGTH(c.comment) as comment_length
FROM candidates c
WHERE c.search_id = 'test-search-id';
```

---

## Known Limitations

1. **SerpAPI Free Tier**: 100 searches/month
2. **OpenRouter Rate Limits**: May vary by plan
3. **AI Analysis Quality**: Depends on profile snippet quality from Google
4. **LinkedIn Profile Access**: Only public profile data visible in search results
5. **Pagination Limit**: SerpAPI typically returns max 100 results per search

---

## Troubleshooting

### Issue: No candidates returned
**Check:**
- SerpAPI API key is valid
- Search query is well-formed (check logs)
- LinkedIn profiles exist for that role/location

### Issue: AI analysis shows "unavailable"
**Check:**
- OpenRouter API key is valid
- Check edge function logs for errors
- Verify model name is correct: `google/gemini-2.0-flash-exp:free`

### Issue: Status updates don't persist
**Check:**
- RLS policies are enabled
- User is authenticated
- Network requests completing successfully
- Check browser console for errors

---

## Success Criteria

A successful test session should demonstrate:
- ✅ Successful search with 10+ candidates
- ✅ AI analysis with valid scores and assessments
- ✅ Pagination loading more results
- ✅ Status changes saved and persisted
- ✅ Comments saved successfully
- ✅ History page shows all searches
- ✅ Excel export works correctly
- ✅ All error cases handled gracefully
- ✅ Responsive design on all devices
- ✅ No console errors or warnings
- ✅ Performance within acceptable ranges

---

## Logging & Debugging

### Edge Function Logs
Check Lovable Cloud logs for:
- Search query construction
- SerpAPI response status
- OpenRouter AI response
- Database save operations
- Error stack traces

### Browser Console
Monitor for:
- Network request status
- State updates
- React warnings
- TypeScript errors

### Database Queries
Use Lovable Cloud Database tab to:
- Verify data saved correctly
- Check RLS policies working
- Inspect JSON structure of ai_analysis
- Confirm cascade deletes working

---

## Report Template

```
Test Date: [DATE]
Tester: [NAME]
Environment: [Production/Staging]

✅ PASSED TESTS:
- [Test Case ID]: [Brief description]

❌ FAILED TESTS:
- [Test Case ID]: [Issue description]
- Error: [Error message]
- Steps to reproduce: [Details]

🐛 BUGS FOUND:
1. [Description]
   - Severity: [Critical/High/Medium/Low]
   - Steps to reproduce
   - Expected vs Actual behavior

📝 NOTES:
- [Any observations or recommendations]

OVERALL ASSESSMENT: [PASS/FAIL]
```
