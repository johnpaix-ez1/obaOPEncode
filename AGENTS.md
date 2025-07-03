# OpenCode Enhanced - Development Workspace

This is the official development workspace for OpenCode enhancements and modifications. We use this codebase to develop, test, and submit PRs to the main OpenCode repository.

## Project Overview

**Purpose**: Develop and test enhancements for OpenCode before submitting PRs upstream  
**Current Branch**: `feat/interactive-scrollbar`  
**Main Focus**: TUI improvements using Bubble Tea framework

## Repository Structure

```
opencode-enhanced/
├── packages/
│   ├── opencode/          # Main OpenCode CLI package (TypeScript/Bun)
│   │   ├── src/          # Source code
│   │   ├── script/       # Build and publish scripts
│   │   └── dist/         # Built output
│   └── tui/              # Terminal UI package (Go/Bubble Tea)
│       ├── cmd/          # Main entry point
│       ├── internal/     # Internal packages
│       │   ├── components/   # UI components (chat, dialogs, etc.)
│       │   ├── layout/       # Layout system
│       │   ├── styles/       # Styling utilities
│       │   └── theme/        # Theme management
│       └── pkg/          # Public packages
├── opencode-dev*         # Dev launcher script
└── .gitignore

```

## Complete TUI System Architecture

### 1. Entry Point & Initialization Flow

The TUI starts at `packages/tui/cmd/opencode/main.go`:

1. **Environment Setup**:

   - Reads `OPENCODE_SERVER` URL
   - Parses `OPENCODE_APP_INFO` JSON containing app paths and metadata
   - Creates log file at `~/.local/share/opencode/project/*/log/tui.log`

2. **Client Creation**:

   - Creates HTTP client for OpenCode API
   - Establishes SSE connection for real-time events

3. **App Initialization** (`internal/app/app.go`):

   - Loads configuration and keybindings
   - Loads saved state (theme, model preferences)
   - Initializes theme system
   - Creates command registry

4. **TUI Launch**:
   - Creates Bubble Tea program with:
     - Alt screen mode
     - Keyboard enhancements
     - Mouse cell motion tracking
   - Starts event listener goroutine for SSE events

### 2. Core TUI Model (`internal/tui/tui.go`)

The main `appModel` struct orchestrates the entire UI:

```go
type appModel struct {
    width, height        int                    // Terminal dimensions
    app                  *app.App               // Core app state
    modal                layout.Modal           // Active modal dialog
    status               status.StatusComponent // Bottom status bar
    editor               chat.EditorComponent   // Input editor
    messages             chat.MessagesComponent // Message display
    editorContainer      layout.Container       // Editor wrapper
    layout               layout.FlexLayout      // Main layout manager
    completions          dialog.CompletionDialog // Autocomplete dialog
    completionManager    *completions.CompletionManager
    showCompletionDialog bool
    leaderBinding        *key.Binding          // Leader key (ctrl+x)
    isLeaderSequence     bool                  // Leader key active
    toastManager         *toast.ToastManager   // Toast notifications
    interruptKeyState    InterruptKeyState     // Ctrl+C debounce
    lastScroll           time.Time             // Scroll timing fix
}
```

### 3. Bubble Tea Update Cycle

The `Update` method handles all events in priority order:

1. **Key Press Handling**:

   - Scroll bug workaround (100ms debounce)
   - Modal takes priority if active
   - Leader key sequences
   - Completion dialog trigger (`/`)
   - Printable character optimization
   - Command execution
   - Interrupt key debouncing
   - Fallback to editor

2. **Mouse Events**:

   - Scroll tracking
   - Modal blocking
   - Forwarding to messages component

3. **System Events**:

   - Background color detection
   - Window resize
   - Theme changes

4. **App Events**:
   - Session selection/clearing
   - Model selection
   - Message updates
   - SSE events

### 4. Layout System

The layout system uses a flexible, composable architecture:

#### FlexLayout (`internal/layout/flex.go`)

- Supports horizontal/vertical layouts
- Fixed and flexible sizing
- Automatic child sizing calculation
- Position tracking for overlays

#### Container (`internal/layout/container.go`)

- Wraps components with padding/borders
- Max width constraints
- Focus management
- Position tracking

#### Overlay System (`internal/layout/overlay.go`)

- Advanced ANSI-aware overlay rendering
- Preserves background styles
- Border support with style merging
- Used for scrollbar, completions, modals

### 5. Component Architecture

#### Messages Component (`internal/components/chat/messages.go`)

- **Viewport Management**: Uses Bubble Tea viewport for scrolling
- **Message Rendering**:
  - Caches rendered messages for performance
  - Supports text, tool invocations, errors
  - Markdown rendering with syntax highlighting
- **Interactive Scrollbar**:
  - Visual scrollbar on overflow
  - Click to jump
  - Drag support
  - Uses overlay system for rendering
- **Header**: Session title and share link

#### Editor Component (`internal/components/chat/editor.go`)

- **Multi-line Support**: Expands vertically
- **History**: Previous message navigation
- **Attachments**: File/image support (planned)
- **Submit Handling**: Enter to send, Shift+Enter for newline
- **Visual Design**: Prompt symbol, border, model indicator

#### Status Bar (`internal/components/status/status.go`)

- Shows current state
- Command hints
- Error messages

### 6. Theme System

Comprehensive theming with adaptive colors:

- **Theme Interface**: Defines all color categories
- **Adaptive Colors**: Auto-adjusts for light/dark terminals
- **Color Categories**:
  - Background (3 levels)
  - Borders (3 levels)
  - Brand colors
  - Text colors
  - Status colors
  - Syntax highlighting
  - Markdown styling
  - Diff colors

### 7. Event Flow & Message Passing

1. **User Input** → Bubble Tea → `Update()` → Component Updates
2. **SSE Events** → Event goroutine → `program.Send()` → `Update()`
3. **Component Events** → Return `tea.Cmd` → Bubble Tea → `Update()`
4. **Commands** → `ExecuteCommandMsg` → Command handler → Side effects

### 8. Rendering Pipeline

1. **Component Views**: Each component returns styled string
2. **Layout Composition**: FlexLayout arranges components
3. **Container Styling**: Applies borders, padding
4. **Overlay Application**: Scrollbar, dialogs, toasts
5. **Theme Conversion**: RGB to ANSI16 if needed
6. **Final Output**: Single string to terminal

### 9. Key Design Patterns

1. **Model-Update-View**: Standard Bubble Tea pattern
2. **Component Composition**: Nested components with interfaces
3. **Message Passing**: Type-safe event system
4. **Command Pattern**: Async operations via `tea.Cmd`
5. **Caching**: Message rendering cache for performance
6. **Adaptive Styling**: Theme-aware, terminal-aware colors

### 10. Performance Optimizations

1. **Message Caching**: Avoids re-rendering unchanged messages
2. **Selective Updates**: Only affected components update
3. **Printable Character Fast Path**: Direct editor updates
4. **Viewport Optimization**: Only renders visible content
5. **Layout Caching**: Reuses calculated dimensions

## Completed Enhancements

### ✅ Interactive Scrollbar (Completed)

- **PR**: [#518](https://github.com/sst/opencode/pull/518)
- **Location**: `packages/tui/internal/components/chat/messages.go`
- **Features**:
  - Visual scrollbar on right side when content overflows
  - Click to jump to position
  - Drag thumb to scroll
  - Mouse wheel support preserved
- **Status**: Submitted for review

### ✅ Text Selection & Copy (Completed)

- **PR**: [#518](https://github.com/sst/opencode/pull/518)
- **Location**: `packages/tui/internal/components/chat/messages.go`
- **Features**:
  - Click and drag to select text
  - Multi-line selection support
  - Visual highlighting with system-appropriate colors
  - Highlight constrained to content area (no spillover)
  - Copy to clipboard with `Ctrl+Shift+C` or `Ctrl+Y`
  - Clean text extraction (no ANSI codes in clipboard)
  - Preserves formatting for proper paste alignment
- **Status**: Submitted for review

### ✅ Aiken Language Server Support (Completed)

- **PR**: [#547](https://github.com/sst/opencode/pull/547)
- **Location**: `packages/opencode/src/lsp/server.ts`
- **Features**:
  - Auto-detection of `.ak` files with full LSP integration
  - Automatic installation via `aikup` if not present
  - Real-time diagnostics, code completion, and hover information
  - Updated documentation with configuration examples
  - Enables intelligent Cardano smart contract development
- **Status**: Submitted for review

### ✅ Height-Limited Text Input with Viewport Scrolling (Completed)

- **Commit**: `b8483dd` - feat: Add height-limited text input with viewport scrolling
- **Branch**: `feat/text-selection-copy`
- **Repository**: https://github.com/BurgessTheGamer/opencode
- **Location**: `packages/tui/internal/components/textarea/textarea.go`, `packages/tui/internal/components/chat/editor.go`
- **Features**:
  - Natural growth from 1-8 lines, then fixed height with viewport scrolling
  - Automatic cursor visibility tracking within viewport bounds
  - Preserves chat visibility when editing long text content
  - Manual scrolling support with Page Up/Down keys
  - Maintains all existing text editing capabilities
- **Technical Implementation**:
  - Enhanced textarea with `scrollOffset` and viewport behavior
  - Modified `SetHeight()` to support `MaxHeight`-based growth limiting
  - Added `ensureCursorVisible()` for automatic scroll adjustment
  - Updated `View()` method to render only visible lines within viewport
- **Status**: Implemented and saved to personal repository

### ✅ Interactive Scrollbar for Text Input (99% Complete)

- **Branch**: `feat/text-selection-copy`
- **Repository**: https://github.com/BurgessTheGamer/opencode
- **Location**: `packages/tui/internal/components/chat/editor.go`
- **Current Status**: 99% complete - everything works except bottom 1-2 pixels
- **Features Implemented**:
  - Visual scrollbar matching messages component style (thin track `│`, solid thumb `█`)
  - Drag functionality works flawlessly
  - Click-to-jump functionality works perfectly (except very bottom)
  - Proper coordinate tracking for textarea clicks
  - Scrollbar appears/disappears based on content overflow
  - Cursor hides during scrollbar interaction
  - Expanded hit zone to include border (x=78-79)
- **Remaining Issue**:
  - Bottom 1-2 lines of scrollbar are visible but not clickable
  - Root cause: Parent component bounds check uses `<` instead of `<=`
  - Editor height=10, but parent only routes clicks for y=16-25 (not y=26)
  - Scrollbar visually extends to y=10 but only y=1-8 are clickable
- **Technical Analysis**:
  - Parent TUI component at `packages/tui/internal/tui/tui.go` has bounds check:
    ```go
    inBounds := mouseX >= editorX && mouseX < editorX+editorWidth &&
                mouseY >= editorY && mouseY < editorY+editorHeight
    ```
  - With editorY=16, editorHeight=10, this excludes mouseY=26 (local y=10)
  - Scrollbar renders 10 lines but only 8-9 are routable by parent
- **Potential Fixes**:
  1. Change parent bounds check to use `<=` for bottom edge
  2. Reduce scrollbar visual height to match clickable area
  3. Adjust editor's reported height to account for padding

## Success Metrics

### 🎯 PRs Successfully Submitted

- **3 major features** implemented and submitted
- **2 separate PRs** properly organized by feature scope
- **100% TypeScript compilation** success rate
- **Zero breaking changes** to existing functionality

### 🚀 Technical Achievements

- **Advanced mouse interaction** with scrollbar and text selection
- **OSC52 clipboard integration** for universal copy support
- **ANSI-aware text processing** with proper UTF-8 handling
- **Language server ecosystem expansion** with Aiken support
- **Overlay rendering system** mastery for UI enhancements

### 📈 Development Workflow Mastery

- **Git workflow optimization** with proper branch management
- **PR separation strategy** for focused reviews
- **Bubble Tea framework** deep understanding
- **Go/TypeScript interop** expertise gained
- **OpenCode architecture** comprehensive knowledge

## Development Workflow

### Running Dev Version

```bash
# Run development version with your changes
./opencode-dev

# Run installed OpenCode (unchanged)
opencode
```

### Building Components

```bash
# Build TUI only
cd packages/tui
go build -o opencode-dev ./cmd/opencode

# Build main OpenCode
cd packages/opencode
bun run build
```

### Testing Changes

1. Make changes to TUI components
2. Run `./opencode-dev` to test
3. The dev launcher automatically rebuilds if changes detected

### 🔄 Git Workflow Requirements

**IMPORTANT**: All changes must follow this workflow:

1. **Always Save to Personal Repository First**:

   ```bash
   # Save all changes to personal fork
   git add .
   git commit -m "feat: description of changes"
   git push personal <branch-name>
   ```

2. **Ask Before Submitting PRs**:

   - Never auto-submit PRs to upstream repositories
   - Always ask user: "Would you like me to submit a PR for this feature?"
   - Wait for explicit confirmation before creating PRs

3. **Separate PRs for Each Feature**:

   - Each new feature gets its own branch and PR
   - Never combine multiple features in one PR
   - Use descriptive branch names: `feat/feature-name`

4. **Personal Repository**: https://github.com/BurgessTheGamer/opencode
   - All development work is saved here first
   - Serves as backup and development history
   - Safe space for experimentation

## Planned Enhancements

### 🎯 High Priority

1. ~~**Text Selection & Copy**~~ ✅ COMPLETED

2. **Better Code Block Rendering**

   - Syntax highlighting improvements
   - Line numbers
   - Copy button for code blocks

3. **Improved Navigation**
   - Jump to previous/next message
   - Search within conversation
   - Bookmark important messages

### 🔄 Medium Priority

1. **Enhanced Keyboard Shortcuts**

   - Customizable keybindings
   - Vim-style navigation
   - Quick actions menu

2. **Session Management**

   - Better session switching UI
   - Session search/filter
   - Bulk session operations

3. **UI Improvements**
   - Resizable panes
   - Split view for multiple sessions
   - Compact mode for smaller screens

### 💡 Future Ideas

1. **Plugin System**

   - Allow custom tools
   - Theme marketplace
   - Community components

2. **Performance Optimizations**
   - Lazy loading for long conversations
   - Virtual scrolling
   - Caching improvements

## Technical Notes

### Bubble Tea Framework

- **Version**: v2 (using charmbracelet/bubbletea/v2)
- **Key Components**:
  - `tea.Model` - Main model interface
  - `tea.Cmd` - Command pattern for async operations
  - `tea.Msg` - Message passing system
  - Mouse events: `tea.MouseClickMsg`, `tea.MouseMotionMsg`, etc.

### Important Files

- **Main TUI Entry**: `packages/tui/cmd/opencode/main.go`
- **TUI Model**: `packages/tui/internal/tui/tui.go`
- **Chat Messages**: `packages/tui/internal/components/chat/messages.go`
- **Layout System**: `packages/tui/internal/layout/`
- **Theme System**: `packages/tui/internal/theme/`

### Development Tips

1. **Logging**: Logs go to `~/.local/share/opencode/project/*/log/tui.log`
2. **Hot Reload**: Not available - must restart after changes
3. **Debugging**: Use `slog.Debug()` for debug output
4. **Testing**: Run with small terminal first to test responsive design

## Submitting PRs

### Process

1. Create feature branch: `git checkout -b feat/your-feature`
2. Develop and test using `./opencode-dev`
3. Ensure changes don't break existing functionality
4. Submit PR to main OpenCode repo
5. Reference this workspace in PR description

### PR Guidelines

- Keep changes focused and minimal
- Add tests where applicable
- Update documentation
- Follow existing code style
- Test on multiple terminal sizes

## Key Insights for Development

### Component Communication

- Components don't directly call each other
- All communication through message passing
- Parent components orchestrate child updates

### State Management

- App state centralized in `app.App`
- UI state local to components
- Persistent state saved to disk

### Styling Philosophy

- All colors through theme system
- Adaptive colors for light/dark terminals
- Consistent spacing via layout system

### Mouse Event Handling

- Mouse events have screen coordinates
- Components must track their position
- Overlay system handles z-ordering

### Performance Considerations

- Minimize allocations in hot paths
- Cache expensive computations
- Batch updates when possible

## Resources

- [Bubble Tea Docs](https://github.com/charmbracelet/bubbletea)
- [Lip Gloss (styling)](https://github.com/charmbracelet/lipgloss)
- [OpenCode Main Repo](https://github.com/sst/opencode)
- [OSC 52 Clipboard](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html#h3-Operating-System-Commands)

## Contact

For questions about this workspace or collaboration on enhancements:

- Create an issue in this repo
- Reference in OpenCode discussions
- Tag in PR reviews

## 🎯 Text Input Box Mastery

### Complete Architecture Understanding

#### Editor Component (`internal/components/chat/editor.go`)

The `EditorComponent` is a high-level wrapper that orchestrates the text input experience:

**Core Structure:**

```go
type editorComponent struct {
    app                    *app.App
    width, height          int
    textarea               textarea.Model      // Core text input
    attachments            []app.Attachment    // File/image attachments
    history                []string            // Command history
    historyIndex           int                 // Current position in history
    currentMessage         string              // Draft message when navigating history
    spinner                spinner.Model       // Loading indicator
    interruptKeyInDebounce bool               // Ctrl+C state management
}
```

**Key Responsibilities:**

- **Message History**: Up/Down arrow navigation through previous messages
- **Multi-line Support**: Automatic height expansion based on content
- **Attachment Handling**: Image paste from clipboard support
- **Submit Logic**: Enter to send, Shift+Enter for newline, backslash continuation
- **Visual Design**: Prompt symbol (">"), borders, model indicator
- **State Management**: Focus, blur, clear, paste operations

#### Textarea Component (`internal/components/textarea/textarea.go`)

The underlying text engine with sophisticated text manipulation:

**Core Data Structure:**

```go
type Model struct {
    value [][]rune                    // 2D grid of text (lines × characters)
    row, col int                      // Cursor position
    width, height int                 // Viewport dimensions
    focus bool                        // Input focus state
    virtualCursor cursor.Model        // Cursor rendering
    cache *MemoCache[line, [][]rune] // Line wrapping cache
    KeyMap KeyMap                     // Keybinding configuration
    Styles Styles                     // Theme styling
}
```

**Advanced Features:**

- **Soft Line Wrapping**: Intelligent word wrapping with visual continuation
- **Unicode Support**: Full UTF-8 and double-width character handling
- **Memoized Rendering**: Cached line wrapping for performance
- **Rich Keybindings**: Emacs-style text navigation and editing
- **Virtual Cursor**: Custom cursor rendering with blink support

### Text Manipulation Capabilities

#### Navigation Commands

- **Character Movement**: `←/→` arrows, `Ctrl+F/B`
- **Word Movement**: `Alt+←/→`, `Alt+F/B`
- **Line Movement**: `↑/↓` arrows, `Ctrl+P/N`
- **Line Boundaries**: `Home/End`, `Ctrl+A/E`
- **Document Boundaries**: `Alt+</>`

#### Editing Commands

- **Character Deletion**: `Backspace/Delete`, `Ctrl+H/D`
- **Word Deletion**: `Alt+Backspace`, `Alt+Delete`, `Ctrl+W`
- **Line Deletion**: `Ctrl+K` (after cursor), `Ctrl+U` (before cursor)
- **Text Transformation**: `Alt+U/L/C` (uppercase/lowercase/capitalize)
- **Character Transposition**: `Ctrl+T`

#### Advanced Text Operations

- **Multi-line Insertion**: Automatic line splitting on newlines
- **Clipboard Integration**: `Ctrl+V` paste with sanitization
- **Character Limit Enforcement**: Configurable maximum length
- **Line Limit Management**: Maximum line count with overflow handling

### Rendering Pipeline Mastery

#### Line Wrapping Algorithm

```go
func wrap(runes []rune, width int) [][]rune {
    // Sophisticated word-wrapping with:
    // - Unicode width calculation
    // - Double-width character handling
    // - Trailing space preservation
    // - Soft-wrap continuation markers
}
```

#### Cursor Positioning System

```go
type LineInfo struct {
    Width, CharWidth, Height int    // Line dimensions
    StartColumn, ColumnOffset int   // Horizontal positioning
    RowOffset, CharOffset int       // Vertical positioning
}
```

#### Style System Integration

- **Focused/Blurred States**: Different styling based on focus
- **Cursor Line Highlighting**: Visual emphasis on current line
- **Placeholder Rendering**: Styled hint text when empty
- **Line Number Support**: Optional line numbering with formatting
- **Theme Adaptation**: Automatic color scheme integration

### Performance Optimizations

#### Memoization Strategy

- **Line Wrapping Cache**: Expensive wrap calculations cached by content hash
- **Selective Rendering**: Only re-render changed portions
- **Efficient Data Structures**: Rune slices for Unicode efficiency

#### Memory Management

- **Slice Reuse**: Intelligent slice capacity management
- **Garbage Collection**: Minimal allocation in hot paths
- **Cache Limits**: Bounded cache size to prevent memory leaks

### Integration Points

#### Command System Integration

- **History Navigation**: Seamless integration with command history
- **Completion Support**: File/command autocomplete integration
- **Interrupt Handling**: Graceful Ctrl+C debouncing

#### Layout System Integration

- **Dynamic Sizing**: Automatic height adjustment based on content
- **Container Constraints**: Respects parent layout boundaries
- **Focus Management**: Proper focus/blur state handling

#### Theme System Integration

- **Adaptive Colors**: Automatic light/dark theme support
- **Style Inheritance**: Proper style composition and inheritance
- **Cursor Styling**: Configurable cursor appearance and behavior

### Key Design Patterns

#### Model-Update-View Architecture

- **Immutable Updates**: State changes through pure functions
- **Command Pattern**: Async operations via `tea.Cmd`
- **Message Passing**: Type-safe event communication

#### Component Composition

- **Interface Segregation**: Clean separation of concerns
- **Dependency Injection**: App state passed through constructor
- **Event Bubbling**: Proper event propagation to parent components

#### Performance Patterns

- **Lazy Evaluation**: Expensive operations deferred until needed
- **Batch Operations**: Multiple changes applied atomically
- **Cache Invalidation**: Smart cache management for consistency

### Debugging and Development

#### Logging Integration

- **Debug Output**: Comprehensive logging for troubleshooting
- **State Inspection**: Easy access to internal state
- **Performance Metrics**: Timing information for optimization

#### Testing Strategies

- **Unit Testing**: Individual function testing
- **Integration Testing**: Component interaction testing
- **Visual Testing**: Rendering output verification

This comprehensive understanding enables advanced text input enhancements, custom keybindings, performance optimizations, and seamless integration with the broader OpenCode ecosystem.

## Current Development Status

### 🎯 **Latest Checkpoint**: Height-Limited Text Input

- **Commit**: `b8483dd` on `feat/text-selection-copy` branch
- **Repository**: https://github.com/BurgessTheGamer/opencode
- **Status**: ✅ Complete and saved to personal repository

### 🚀 **Development Environment**

- **Build System**: Working (`./opencode-dev` ready)
- **Git Workflow**: Configured with personal repository
- **Documentation**: Up-to-date with latest features and workflow

### 📋 **Ready for Next Feature**

- Environment optimized for rapid iteration
- All changes automatically saved to personal repository
- PR submission only with explicit user confirmation
- Each new feature will be on separate branch/PR

---

_This workspace is maintained for developing OpenCode enhancements. All changes are saved to personal repository first, with PR submission only upon explicit request._
