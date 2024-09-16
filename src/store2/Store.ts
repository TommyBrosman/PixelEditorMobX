import { makeAutoObservable } from "mobx"
import { SharedTreeConnection, start } from "../model/Model";
import { Tree } from "fluid-framework";

export class AppStore {
	// TODO: This might be unnecessary now
	public isLoaded: boolean = false;
	public itemBoard: number[][] = [];
	private readonly sharedTreeConnection: SharedTreeConnection;

	public constructor(sharedTreeConnection?: SharedTreeConnection) {
		makeAutoObservable(this);

		this.sharedTreeConnection = sharedTreeConnection ?? { pixelEditorTreeView: undefined };

		// TODO: Move this out of the ctor and/or inject the PixelEditorTreeView factory
		this.initialLoad();
	}

	public setCell(x: number, y: number, value: number): void {
		this.sharedTreeConnection.pixelEditorTreeView?.root.setCell(x, y, value);
	}

	private initialLoad(): void {
		start().then((pixelEditorTreeView) => {
			Tree.on(pixelEditorTreeView.root, "treeChanged", () => {
				this.itemBoard = pixelEditorTreeView.root.getBoardAsNestedArray();
				this.isLoaded = true;
			});
		});
	}
}

/**
 * Facade method to setting up the store.
 * @param sharedTreeConnection Contains the Shared Tree TreeView when connected.
 * @returns The composed store.
 */
export function setupStore(sharedTreeConnection?: SharedTreeConnection): AppStore {
	return new AppStore(sharedTreeConnection);
}
