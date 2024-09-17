import { makeAutoObservable } from "mobx"
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

		this.sharedTreeConnection = sharedTreeConnection ?? { pixelEditorTreeView: undefined };
		makeAutoObservable(this);
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
export function setupStore(preloadedState?: AppState, sharedTreeConnection?: SharedTreeConnection): AppStore {
	return new AppStore(preloadedState, sharedTreeConnection);
}
function runInAction(arg0: () => void) {
	throw new Error("Function not implemented.");
}
