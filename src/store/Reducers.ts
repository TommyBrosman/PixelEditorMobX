import { Tree } from "fluid-framework";
import { asyncThunkCreator, buildCreateSlice, type PayloadAction } from '@reduxjs/toolkit'
import { start, type SharedTreeConnection } from "./Model";
import { type AppState, initialAppState } from "./State";

// Use the version of createSlice that supports async thunks
const createAppSlice = buildCreateSlice({
	creators: { asyncThunk: asyncThunkCreator },
});

/**
 * The root reducers for application state.
 */
const appSlice = createAppSlice({
	name: "app",
	initialState: initialAppState,
	reducers: (create) => ({

		// Applies remote tree changes to the in-memory app state
		applyRemoteTreeChange: create.reducer((state: AppState, action: PayloadAction<number[][]>): AppState => {
			// Preserve other elements of the state object
			const { itemBoard, ...other } = state;
			return { itemBoard: action.payload, ...other };
		}),

		// Sets the isConnected flag
		markIsConnected: create.reducer((state: AppState): AppState => {
			// Preserve other elements of the state object
			const { isLoaded, ...other } = state;
			return { isLoaded: true, ...other };
		}),

		/**
		 * Thunk. Sets a cell on the board to a specific value.
		 */
		setCell: create.asyncThunk<void, {x: number, y: number, value: number}, { extra: SharedTreeConnection }>(
			async (thunkArg: {x: number, y: number, value: number}, thunkAPI): Promise<void> => {
				const { x, y, value } = thunkArg;

				// Can fail if thunkSetCell runs before the tree is loaded
				const sharedTreeConnection = thunkAPI.extra;
				sharedTreeConnection.pixelEditorTreeView?.root.setCell(x, y, value);
			}),

		/**
		 * Thunk. Connects to the Fluid session. Steps:
		 * - Join or create a session
		 * - Wire up events that dispatch reducers when the Shared Tree instance changes (either due to local or remote edits)
		 */
		connectToFluid: create.asyncThunk<void, void, { extra: SharedTreeConnection }>(
			async (_, { dispatch, extra }) => {
				const pixelEditorTreeView = await start();
				Tree.on(pixelEditorTreeView.root, "treeChanged", () => {
					const currentBoard = pixelEditorTreeView.root.getBoardAsNestedArray();
					dispatch(applyRemoteTreeChange(currentBoard));
				});

				const sharedTreeConnection = extra;
				sharedTreeConnection.pixelEditorTreeView = pixelEditorTreeView;

				// Dispatch the first change notification. The board was loaded before the event was wired up via Tree, so we need
				// to dispatch it manually.
				dispatch(applyRemoteTreeChange(pixelEditorTreeView.root.getBoardAsNestedArray()));

				// Sets the isLoaded flag.
				dispatch(markIsConnected());
			})
	})
})

export const appReducer = appSlice.reducer;
export const { applyRemoteTreeChange, markIsConnected, setCell, connectToFluid } = appSlice.actions;
