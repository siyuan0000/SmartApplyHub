# Fixing AI Content Persistence Issue in Next.js Resume Editor

## 1. Tracing the Enhancement Pipeline

Trace the full enhancement save flow:

- `useSectionEnhancement.ts` → `onApplyEnhancement()` → `applyEnhancedContent()` → `handleSave()` → `forceSave()` → `ResumeService.updateResume()`

Ensure each step passes and applies updated content correctly.


## 2. Ensure Deep State Updates

```ts
// Bad (shallow mutation)
resume.content[sectionId] = enhancedText;
setResume(resume);

// Good (immutable update)
setResume(prev => {
  const updatedContent = { ...prev.content };
  updatedContent[sectionId] = enhancedText;
  return { ...prev, content: updatedContent };
});
```

This ensures React detects the update and marks the resume dirty.


## 3. Add Debug Logging

Insert checkpoints at:

### In `applyEnhancedContent()`:

```ts
console.log("Applying enhanced content:", sectionId, enhancedText);
```

### In `handleSave()`:

```ts
console.log("handleSave called. force =", force);
```

### In `forceSave()`:

```ts
console.log("forceSave started");
console.log("Saving payload:", resume);
```

### In `ResumeService.updateResume()`:

```ts
console.log("Saving to Supabase with:", updateFields);
console.log("Save response:", response);
```


## 4. Force Save After AI Enhancement

Ensure immediate save even if no manual edits:

```ts
// onApplyEnhancement should be async
await handleSave(true);
```

And in `handleSave(force)`:

```ts
if (force) {
  await forceSave();
  return;
}
```


## 5. Await Chain Integrity

Ensure all async calls are awaited:

- `onApplyEnhancement` is `async`
- `handleSave(force)` is `async`
- `ResumeService.updateResume()` returns a promise and is awaited


## 6. Sample Refactored `handleSave`

```ts
async function handleSave(force = false) {
  if (force) {
    const { error } = await ResumeService.updateResume(resume.id, { content: resume.content });
    if (error) {
      console.error("Save failed:", error);
      toast.error("Save failed");
    } else {
      console.log("Save successful.");
    }
  }
}
```

---

By applying all of the above, AI-enhanced resume content will persist to Supabase reliably and immediately.