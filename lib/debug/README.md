# Resume Save Pipeline Debug Logger

This debug logging system provides comprehensive tracking for every resume save operation in the application. It helps identify exactly where save operations fail and provides detailed error information.

## Features

- 🔍 **Complete Pipeline Tracking**: Logs every step from UI button click to database save
- 🕒 **Performance Monitoring**: Tracks timing for each step to identify bottlenecks  
- 📊 **Session Management**: Groups related operations under unique session IDs
- 💾 **Persistent Storage**: Saves logs to localStorage for debugging across page reloads
- 🎯 **Error Tracking**: Detailed error logging with stack traces and context
- 📈 **Analytics**: Performance metrics and success/failure rates

## How to Use

### Viewing Logs in Console

The logger automatically outputs to the browser console with emoji indicators:

- 🚀 Session started
- 🔄 Operation in progress  
- ✅ Step completed successfully
- ❌ Error occurred
- ⚠️ Warning/non-critical issue
- 🏁 Session completed

### Debug Commands

The logger is available globally in the browser console as `window.saveLogger`:

```javascript
// View summary of last save attempt
saveLogger.printSessionSummary()

// View all recent save sessions
saveLogger.printAllSessions()

// Get specific session details
const session = saveLogger.getSession('save_1640995200000_abc123')

// Clear all logs
saveLogger.clearLogs()
```

### Logged Pipeline Steps

#### 1. Editor Level (ResumeEditor.tsx)
- `session_start` - Session initialization
- `editor_handle_save` - HandleSave function called
- `editor_calling_force_save` - About to call forceSave
- `editor_force_save_complete` - ForceSave returned successfully
- `editor_skip_save` - Save skipped (not dirty and not forced)
- `editor_on_save_callback` - onSave callback executed
- `save_complete` - Overall save operation completed

#### 2. Hook Level (useResumeEditor.ts)
- `hook_save_resume` - SaveResume function started
- `hook_validation_failed` - Missing content or resumeId
- `hook_dirty_check` - Content change detection
- `hook_set_saving_state` - UI saving state updated
- `hook_content_validation` - Content structure validation
- `hook_content_clone` - Deep copy creation
- `hook_calling_service` - About to call ResumeService
- `hook_service_complete` - Service call returned
- `hook_state_updated` - Final state update
- `hook_save_error` - Error occurred in hook
- `hook_retry_attempt` - Retry logic triggered

#### 3. Service Level (ResumeService.ts)
- `service_update_resume` - Service method started
- `service_preparing_request` - Preparing API request
- `service_making_fetch` - Making fetch request
- `service_fetch_complete` - Fetch request completed
- `service_error_parsing` - Parsing error response
- `service_http_error` - HTTP error occurred
- `service_parsing_response` - Parsing success response
- `service_response_parsed` - Response parsed successfully
- `service_no_resume_data` - No resume in response
- `service_update_complete` - Service operation completed
- `service_update_error` - Error in service layer

### Session Data Structure

Each save session includes:

```typescript
{
  sessionId: string           // Unique identifier
  startTime: number          // Timestamp when started
  totalDuration: number      // Total time taken (ms)
  steps: SaveLogEntry[]      // All logged steps
  finalStatus: 'success' | 'error' | 'unknown'
  resumeId: string          // Resume being saved
  userId: string            // User performing save
}
```

### Log Entry Structure

Each step includes:

```typescript
{
  timestamp: string         // ISO timestamp
  step: string             // Step identifier
  status: 'start' | 'success' | 'error' | 'warning'
  data: any               // Context data
  error: string           // Error message if applicable
  duration: number        // Time taken (ms)
  sessionId: string       // Parent session ID
}
```

## Troubleshooting Common Issues

### Save Operation Fails

1. Open browser console
2. Run `saveLogger.printSessionSummary()` to see the last save attempt
3. Look for steps with ❌ error status
4. Check the error message and context data

### Performance Issues  

1. Run `saveLogger.printAllSessions()` to see timing data
2. Look for sessions with high totalDuration
3. Identify slow steps in the Performance column
4. Check network timing vs processing timing

### Intermittent Failures

1. Save logs persist across page reloads
2. Run `saveLogger.printAllSessions()` to see historical pattern
3. Look for retry attempts and their success rates
4. Check if failures correlate with specific content types

## Integration Details

### Automatic Session Tracking

- Sessions are automatically created when save operations begin
- Session IDs are passed through the entire pipeline for continuity
- Sessions automatically end when operations complete or fail

### Error Handling

- All errors are logged with full context before being re-thrown
- Original error handling behavior is preserved
- Retry attempts are tracked with their own log entries

### Performance Impact

- Minimal overhead (~1-2ms per logged step)
- Logs are batched to avoid console spam
- Old sessions are automatically cleaned up (max 50 stored)
- LocalStorage usage is limited to last 10 sessions

## Storage and Persistence

- Active sessions stored in memory
- Last 10 sessions persisted to localStorage
- Logs survive page reloads and browser restarts
- Can be cleared manually with `saveLogger.clearLogs()`

## Example Console Output

```
🚀 SAVE SESSION STARTED: save_1640995200000_abc123
📋 Session Details: { sessionId: "save_1640995200000_abc123", resumeId: "resume_456", ... }

🔄 [abc123] EDITOR HANDLE SAVE { step: "editor_handle_save", status: "start", ... }
🔄 [abc123] EDITOR CALLING FORCE SAVE { step: "editor_calling_force_save", status: "start", ... }
🔄 [abc123] HOOK SAVE RESUME { step: "hook_save_resume", status: "start", ... }
✅ [abc123] HOOK CONTENT VALIDATION { step: "hook_content_validation", status: "success", ... }
🔄 [abc123] SERVICE UPDATE RESUME { step: "service_update_resume", status: "start", ... }
✅ [abc123] SERVICE FETCH COMPLETE { step: "service_fetch_complete", status: "success", duration: "234ms", ... }
✅ [abc123] SAVE COMPLETE { step: "save_complete", status: "success", ... }

🏁 SAVE SESSION COMPLETED: save_1640995200000_abc123
{
  finalStatus: "success",
  totalDuration: "456ms", 
  totalSteps: 12,
  successSteps: 11,
  errorSteps: 0,
  performance: { avgStepTime: 38, slowestStep: "service_fetch_complete (234ms)" }
}
```

This comprehensive logging system makes debugging save issues much easier by providing complete visibility into the save pipeline.