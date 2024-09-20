import { makeAutoObservable, runInAction } from "mobx"
import type { SharedTreeConnection } from "../model/Model";
import { type ImplicitFieldSchema, Tree, type TreeNode, type TreeNodeSchema, type TreeView } from "fluid-framework";

export class BaseStore<TState extends {}, TSchema extends ImplicitFieldSchema> {
	private readonly state: TState;
	private readonly sharedTreeConnection: SharedTreeConnection<TSchema>;

	public constructor(
		private readonly start: () => Promise<TreeView<TSchema>>,
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
	public async connectToFluid(): Promise<void> {
		const treeView = await this.start();

		// HACK: This type assertion shouldn't be needed
		const root: TreeNode = <TreeNode>treeView.root;
		Tree.on(root, "treeChanged", () => {
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
}

/**
 * Facade method to setting up the store.
 * @param preloadedState Preloaded state for testing.
 * @param sharedTreeConnection Contains the Shared Tree TreeView when connected. Used in tests.
 * @returns The composed store.
 */
export async function setupStore<TState extends {}, TSchema extends TreeNodeSchema>(
	start: () => Promise<TreeView<TSchema>>,
	applyFluidState: (treeView: TreeView<TSchema>, state: TState) => void,
	preloadedState?: TState,
	sharedTreeConnection?: SharedTreeConnection<TSchema>):
	Promise<BaseStore<TState, TSchema>> {
	const store = new BaseStore(start, applyFluidState, preloadedState, sharedTreeConnection);

	// Don't connect to Fluid if preloadedState is specified
	if (preloadedState === undefined) {
		await store.connectToFluid();
	}

	return store;
}
