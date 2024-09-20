import { makeObservable, observable, runInAction } from "mobx"
import type { SharedTreeConnection } from "../model/Model";
import type { ImplicitFieldSchema, TreeNodeSchema, TreeView } from "fluid-framework";

export class BaseStore<TState extends {}, TSchema extends ImplicitFieldSchema> {
	private readonly state: TState;
	private readonly sharedTreeConnection: SharedTreeConnection<TSchema>;

	public constructor(
		private readonly applyFluidState: (treeView: TreeView<TSchema>, state: TState) => void,
		preloadedState?: TState,
		sharedTreeConnection?: SharedTreeConnection<TSchema>) {
		this.state = preloadedState ?? <TState>{};

		// `observable` uses deep equality, so any changes to fields of `this.state` will be observed.
		makeObservable({
			state: observable
		});

		this.sharedTreeConnection = sharedTreeConnection ?? { treeView: undefined };
	}

	/**
	 * Async action. Connects to the Fluid session. Steps:
	 * - Join or create a session
	 * - Wire up events that dispatch reducers when the Shared Tree instance changes (either due to local or remote edits)
	 */
	public async connectToFluid(treeView: TreeView<TSchema>): Promise<void> {
		treeView.events.on("rootChanged", () => {
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
	const store = new BaseStore(applyFluidState, preloadedState, sharedTreeConnection);

	// Don't connect to Fluid if preloadedState is specified
	if (preloadedState === undefined) {
		const treeView = await start();
		await store.connectToFluid(treeView);
	}

	return store;
}
