import { combineReducers, configureStore } from "@reduxjs/toolkit";
import type { SharedTreeConnection } from "./Model";
import { appReducer } from "./Reducers";

const rootReducer = combineReducers({ app: appReducer });

/**
 * Set up root store for the application.
 */
export function setupStore(preloadedState?: Partial<RootState>, sharedTreeConnection?: SharedTreeConnection) {
	return configureStore({
		reducer: rootReducer,
		middleware: getDefaultMiddleware => {
			const effectiveSharedTreeConnection = sharedTreeConnection ?? { pixelEditorTreeView: undefined };
			return getDefaultMiddleware({
				thunk: {
					extraArgument: effectiveSharedTreeConnection
				}
			});
		},
		preloadedState
	})
}

// Get the type of our store variable as well as the RootState type that matches the store and an AppDispatch type that includes
// the thunk dispatcher signature.
export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];
