import { makeAutoObservable, runInAction } from "mobx"
import { type SharedTreeConnection, start } from "../model/Model";
import { Tree } from "fluid-framework";
import type { AppState } from "../store/State";

export class AppStore {
	public isLoaded = false;
	public itemBoard: number[][] = [];
	private readonly sharedTreeConnection: SharedTreeConnection;

	public constructor(preloadedState?: AppState, sharedTreeConnection?: SharedTreeConnection) {
		if (preloadedState !== undefined) {
			this.isLoaded = preloadedState.isLoaded;
			this.itemBoard = preloadedState.itemBoard;
		}

		// Call before setting the connection so that it doesn't get overwritten by a Proxy object
		makeAutoObservable(this);

		this.sharedTreeConnection = sharedTreeConnection ?? { pixelEditorTreeView: undefined };
	}

	public setCell(x: number, y: number, value: number): void {
		this.sharedTreeConnection.pixelEditorTreeView?.root.setCell(x, y, value);
	}

	public async connectToFluid(): Promise<void> {
		const pixelEditorTreeView = await start();
		Tree.on(pixelEditorTreeView.root, "treeChanged", () => {
			this.itemBoard = pixelEditorTreeView.root.getBoardAsNestedArray();
		});

		runInAction(() => {
			this.isLoaded = true;
			this.sharedTreeConnection.pixelEditorTreeView = pixelEditorTreeView;
		});
	}
}

/**
 * Facade method to setting up the store.
 * @param sharedTreeConnection Contains the Shared Tree TreeView when connected.
 * @returns The composed store.
 */
export async function setupStore(preloadedState?: AppState, sharedTreeConnection?: SharedTreeConnection): Promise<AppStore> {
	const store = new AppStore(preloadedState, sharedTreeConnection);
	await store.connectToFluid();
	return store;
}
