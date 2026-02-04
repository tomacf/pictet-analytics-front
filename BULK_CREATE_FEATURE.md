# Bulk Create Feature Documentation

## Overview
This feature adds a wizard-style bulk creation capability to Teams, Rooms, and Juries configuration pages.

## How It Works

### For Users

#### Teams & Juries
1. Navigate to Teams or Juries page
2. Click the **"Bulk Create"** button (next to "Create Team/Jury")
3. In the modal, enter multiple labels separated by commas:
   ```
   Team Alpha, Team Beta, Team Gamma, Team Delta
   ```
4. Click **"Create Teams"** or **"Create Juries"**
5. See success/error notifications for each item
6. The modal stays open - add more items or click "Close"

#### Rooms
1. Navigate to Rooms page
2. Click the **"Bulk Create"** button
3. Set the **Default Max Size** (applies to all rooms, default: 30)
4. Enter room labels separated by commas:
   ```
   Room A, Room B, Room C
   ```
5. Click **"Create Rooms"**
6. All rooms are created with the specified max_size
7. Modal stays open for more additions

### Key Features

- **Comma-separated input**: Simple text input format
- **Batch processing**: Creates multiple items with one action
- **Error resilience**: Partial failures don't stop the process
- **Individual feedback**: Toast notifications for each item
- **Continuous workflow**: Modal stays open for wizard-like experience
- **Clear guidance**: Placeholder text and help hints

## Technical Details

### Implementation Pattern

Each page (Teams, Rooms, Juries) follows the same pattern:

```typescript
// State management
const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
const [bulkInput, setBulkInput] = useState('');

// Bulk creation handler
const handleBulkSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Parse comma-separated input
  const labels = bulkInput
    .split(',')
    .map(label => label.trim())
    .filter(label => label.length > 0);
  
  // Validate
  if (labels.length === 0) {
    toast.warning('Please enter at least one label');
    return;
  }
  
  // Create items sequentially
  let successCount = 0;
  for (const label of labels) {
    try {
      await Service.create({ requestBody: { label } });
      successCount++;
    } catch (err) {
      toast.error(`Failed to create "${label}"`);
    }
  }
  
  // Show summary and refresh
  if (successCount > 0) {
    toast.success(`Successfully created ${successCount} item(s)`);
    fetchItems();
    setBulkInput(''); // Clear input for next batch
  }
  // Modal stays open
};
```

### UI Components

- **Button**: Added "Bulk Create" button next to existing "Create" button
- **Modal**: Reuses existing `Modal` component
- **Form**: Standard form with textarea input
- **Notifications**: Uses `react-toastify` for feedback

### Error Handling

- **Empty input**: Warning toast, no API calls
- **Individual failures**: Error toast for each failed item
- **Partial success**: Successful items are created, failed ones are reported
- **Network errors**: Caught and displayed per item

## Benefits

1. **Faster bulk operations**: Create 10+ items in seconds
2. **No modal reopening**: Continuous workflow
3. **Better UX**: Clear feedback for each operation
4. **Reduced clicks**: One modal open vs. N modal opens
5. **Flexible**: Can create 1 or 100 items with same interface

## Code Quality

- ✅ Minimal changes to existing code
- ✅ Consistent pattern across all pages
- ✅ Reuses existing components and services
- ✅ Proper TypeScript typing
- ✅ Clean error handling
- ✅ No security vulnerabilities (CodeQL verified)

## Examples

### Creating Multiple Teams
Input:
```
Sales Team, Marketing Team, Engineering Team, HR Team
```
Result: 4 teams created with labels as specified

### Creating Multiple Rooms with Same Size
- Max Size: 25
- Input: `Conference A, Conference B, Meeting Room 1, Meeting Room 2`
- Result: 4 rooms created, all with max_size=25

### Creating Juries
Input:
```
Jury 1, Jury 2, Jury 3
```
Result: 3 juries created

## Future Enhancements (Optional)

Potential improvements for future iterations:
- Support for TSV/CSV paste from spreadsheets
- Bulk edit capability
- Import from file
- Template-based creation
- Validation preview before creation
- Undo last batch operation
