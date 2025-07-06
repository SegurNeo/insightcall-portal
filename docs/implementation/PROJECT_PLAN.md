# Project Plan: Conversational AI Dashboard Enhancement

**Goal:** Enhance the existing dashboard to display conversational AI call analysis results and allow management of ERP-like actions triggered by calls. Implement an MVP connecting to the real Eleven Labs API for call data.

**Phase 1: Foundation & Eleven Labs Integration**

*   [ ] **1. Define Data Models (`src/types/` or `src/interfaces/`)**
    *   [ ] `ConversationSummary`: Interface based on the list response from `GET /v1/convai/conversations` (e.g., `agent_id`, `conversation_id`, `start_time_unix_secs`, `call_duration_secs`, `message_count`, `status`, `call_successful`, `agent_name`).
    *   [ ] `ConversationDetail`: Interface based on the detail response from `GET /v1/convai/conversations/:conversation_id` (including `transcript` array: `{ role: string; time_in_call_secs: number; message: string }` and `metadata`).
    *   [ ] `Action`: Interface representing a mock ERP action (e.g., `id: string`, `name: string`, `description?: string`).
    *   [ ] `CallAnalysis`: Interface linking a `conversation_id` to an `Action` (e.g., `analysis_id: string`, `conversation_id: string`, `action_id: string`, `status: 'pending' | 'success' | 'error'`, `details?: string`).
*   [ ] **2. Implement Eleven Labs API Service (`src/services/callService.ts`)**
    *   [ ] Set up secure handling for Eleven Labs API Key (using Vite's environment variables: `import.meta.env.VITE_ELEVENLABS_API_KEY`). **Remember to add `.env` to `.gitignore`**.
    *   [ ] Implement `getConversations()`: Function to fetch data from `GET /v1/convai/conversations`. Use `fetch` or a library like `axios`. Map response to `ConversationSummary[]`. Handle pagination (`next_cursor`).
    *   [ ] Implement `getConversationDetail(conversationId: string)`: Function to fetch data from `GET /v1/convai/conversations/:conversation_id`. Map response to `ConversationDetail`.
    *   [ ] Implement proper error handling (network errors, API errors) and potentially return types that include loading/error states (or use a library like TanStack Query).
*   [ ] **3. Implement Mock Analysis Service (`src/services/analysisService.ts`)**
    *   [ ] Create function `analyzeTranscript(transcript: ConversationDetail['transcript'])`: Takes the transcript array.
    *   [ ] Implement *initial simple logic* (e.g., check for keywords like "cancelar póliza", "devolver recibo" in user messages) to determine the appropriate `Action` ID from the mock list.
    *   [ ] Return a simulated `CallAnalysis` object (e.g., `{ analysis_id: '...', conversation_id: '...', action_id: '...', status: 'success' }`).
*   [ ] **4. Implement Mock Actions CRUD Service (`src/services/actionService.ts`)**
    *   [ ] Define an initial array of mock `Action` objects in the service (using the `Action` interface). Examples: Devolución de recibos, Anulación de pólizas, Siniestros, etc.
    *   [ ] Implement `getActions(): Promise<Action[]>`: Returns the list (simulating async).
    *   [ ] Implement `getAction(id: string): Promise<Action | undefined>`: Finds action by ID.
    *   [ ] Implement `createAction(actionData: Omit<Action, 'id'>): Promise<Action>`: Adds to the list (generates ID, persists in memory/localStorage).
    *   [ ] Implement `updateAction(id: string, actionData: Partial<Action>): Promise<Action | undefined>`: Updates item.
    *   [ ] Implement `deleteAction(id: string): Promise<void>`: Removes item.

**Phase 2: Frontend Integration**

*   [ ] **5. Integrate Call List View**
    *   [ ] Locate or create the main component/page for the call list.
    *   [ ] Use `callService.getConversations()` to fetch and display `ConversationSummary` data (e.g., in a table).
    *   [ ] Implement UI feedback for loading and error states.
    *   [ ] Add navigation (e.g., onClick on a row) to a detail view, passing the `conversation_id`.
*   [ ] **6. Create/Integrate Call Detail View**
    *   [ ] Create a component/page to show details for a specific `conversation_id`.
    *   [ ] Fetch data using `callService.getConversationDetail(conversationId)`.
    *   [ ] Display metadata (agent name, duration, status) and the formatted transcript.
    *   [ ] **Display Call Analysis Result:**
        *   Once detail is loaded, call `analysisService.analyzeTranscript()` with the transcript.
        *   Use the resulting `action_id` to fetch action details via `actionService.getAction()`.
        *   Display the identified action name (e.g., "Acción Identificada: Anulación de Póliza") and the analysis status.
*   [ ] **7. Create Actions Management Page (`src/pages/ActionsManager.tsx`?)**
    *   [ ] Create a new route and page for managing `Action` mocks.
    *   [ ] Use `actionService` to fetch and display actions in a table (using components from your UI library, likely shadcn/ui).
    *   [ ] Implement a "Crear Acción" button/form (perhaps using a Dialog/Modal).
    *   [ ] Add "Editar" and "Eliminar" functionality for each action in the table.
*   [ ] **8. Set Up Routing & Navigation**
    *   [ ] Ensure React Router (or your chosen router) is configured with routes for the list, detail, and actions pages.
    *   [ ] Add links in the main navigation (e.g., Sidebar) to these new sections.

**Key Considerations:**

*   **API Key:** Store the Eleven Labs API key in a `.env` file at the root (`VITE_ELEVENLABS_API_KEY=your_key_here`) and ensure `.env` is in your `.gitignore`. Access it via `import.meta.env.VITE_ELEVENLABS_API_KEY`.
*   **UI Library:** Leverage the existing UI components (likely shadcn/ui) for consistency.
*   **State Management:** Consider using React Query/TanStack Query for managing API data fetching, caching, loading, and error states, as it simplifies this significantly. 