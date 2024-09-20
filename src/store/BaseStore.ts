import { makeAutoObservable, runInAction } from "mobx"
import type { SharedTreeConnection } from "../model/Model";
import { ContainerSchema, type ImplicitFieldSchema, Tree, TreeConfiguration, type TreeNodeSchema, type TreeView } from "fluid-framework";
import { TinyliciousClient } from "@fluidframework/tinylicious-client/internal";

export class BaseStore<TState extends {}, TSchema extends ImplicitFieldSchema > {
	private readonly state: TState;
	private readonly sharedTreeConnection: SharedTreeConnection<TSchema>;

	public constructor(
		// HACK: Only supports Tinylicious for now
		private readonly client: TinyliciousClient,
		private readonly applyFluidState: (treeView: TreeView<TSchema>, state: TState) => void,
		preloadedState?: TState,
		sharedTreeConnection?: SharedTreeConnection<TSchema>) {
		if (preloadedState !== undefined) {
			this.state = preloadedState;
		} else {
			this.state = <TState>{};
		}

		// Call before setting the connection so that it doesn't get overwritten by a Proxy object
		makeAutoObservable(this);

		this.sharedTreeConnection = sharedTreeConnection ?? { treeView: undefined };
	}

	/**
	 * Async action. Connects to the Fluid session. Steps:
	 * - Join or create a session
	 * - Wire up events that dispatch reducers when the Shared Tree instance changes (either due to local or remote edits)
	 */
	public async connectToFluid<TContainerSchema extends ContainerSchema>(
		containerSchema: TContainerSchema,
		treeConfiguration: TreeConfiguration): Promise<void> {
		const treeView: TreeView<TSchema> = await this.start(containerSchema, treeConfiguration);
		Tree.on(treeView.root, "treeChanged", () => {
			runInAction(() => {
				this.applyFluidState(treeView, this.state);
			});
		});

		runInAction(() => {
			this.sharedTreeConnection.treeView = treeView;

			// Dispatch the first change notification. The board was loaded before the event was wired up via Tree, so we need
			// to dispatch it manually.
			this.applyFluidState(treeView, this.state);
		});
	}

	/**
	 * Join or start a Shared Tree session.
	 * @returns The Tree View.
	 */
	private async start<TContainerSchema extends ContainerSchema>(
		containerSchema: TContainerSchema,
		treeConfiguration: TreeConfiguration):
		Promise<TreeView<TSchema>> {
		let treeView: TreeView<TSchema> | undefined;
		if (location.hash) {
			treeView = await this.loadExistingTreeView(location.hash.substring(1), containerSchema, treeConfiguration);
		} else {
			const result = await this.createNewTreeView(containerSchema, treeConfiguration);
			location.hash = result.id;
			treeView = result.pixelEditorTreeView;
		}

		return treeView;
	}

	private async createNewTreeView<TContainerSchema extends ContainerSchema>(
		containerSchema: TContainerSchema,
		treeConfiguration: TreeConfiguration):
		Promise<{id: string, pixelEditorTreeView: TreeView<TSchema>}> {
		const { container } = await this.client.createContainer(containerSchema);
		const treeView = container.initialObjects.pixelEditorTree.schematize(treeConfiguration);
		const id = await container.attach();
		return { id, pixelEditorTreeView: treeView };
	}

	private async loadExistingTreeView<TContainerSchema extends ContainerSchema>(
		id: string,
		containerSchema: TContainerSchema,
		treeConfiguration: TreeConfiguration):
		Promise<TreeView<TSchema>> {
		const { container } = await this.client.getContainer(id, containerSchema);
		const treeView = container.initialObjects.pixelEditorTree.schematize(treeConfiguration);
		return treeView;
	}
}

/**
 * Facade method to setting up the store.
 * @param preloadedState Preloaded state for testing.
 * @param sharedTreeConnection Contains the Shared Tree TreeView when connected. Used in tests.
 * @returns The composed store.
 */
export async function setupStore<TState extends {}, TSchema extends TreeNodeSchema>(
	applyFluidState: (treeView: TreeView<TSchema>, state: TState) => void,
	preloadedState?: TState,
	sharedTreeConnection?: SharedTreeConnection<TSchema>):
	Promise<BaseStore<TState, TSchema>> {
	const store = new BaseStore(applyFluidState, preloadedState, sharedTreeConnection);

	// Don't connect to Fluid if preloadedState is specified
	if (preloadedState === undefined) {
		await store.connectToFluid();
	}

	return store;
}
