import React from "react";
import { assert, expect } from "chai";

// eslint-disable-next-line import/no-unassigned-import
import "@testing-library/dom"
import { fireEvent, render, waitFor } from "@testing-library/react";
import Grid from "./Grid";
import { boardHeight, boardWidth, initialItemBoard } from "./model/InitialItemBoard";
import { setupStore } from "./store/Store";
import type { PixelEditorSchema, SharedTreeConnection } from "./model/Model";
import type { TreeView } from "fluid-framework";
import { StoreContext } from "./store/Hooks";

/**
 * Wait for the thunk that connects to Fluid.
 * @param sharedTreeConnection The connection injected into the store.
 * @returns The promise to wait on.
 */
const waitForFluidConnection = async (sharedTreeConnection: SharedTreeConnection) =>
	waitFor(() => {
		expect(sharedTreeConnection.pixelEditorTreeView, "Ensure that tinylicious is running.").to.not.be.undefined;
	});

/**
 * Count the number of cells stored in the backing Fluid Tree.
 * @param sharedTreeConnection The Fluid Tree connection.
 * @param kind Which kind of cell to count.
 * @returns The number of matching cells.
 */
const countCellsInModel = (sharedTreeConnection: SharedTreeConnection, kind: 'black' | 'white') => {
	assert(sharedTreeConnection.pixelEditorTreeView !== undefined, "Must be connected to Fluid.");
	const treeView = sharedTreeConnection.pixelEditorTreeView as TreeView<typeof PixelEditorSchema>;
	const cellValues = Array.from(treeView.root.board.values());
	const kindValue = kind === 'black' ? 0 : 1;
	return cellValues.reduce((total, current) => total + (current === kindValue ? 1 : 0));
}

describe("Tests for Grid", () => {
	/**
	 * Visual test for the Grid component. Ignores Fluid and tells the app that the board is already loaded.
	 */
	it("Displays an 8x8 board", async (): Promise<void> => {
		const store = await setupStore({ itemBoard: initialItemBoard, isLoaded: true });
		const { container } = render(
			<StoreContext.Provider value={store}>
				<Grid/>
			</StoreContext.Provider>);

		const cells = Array.from(container.querySelectorAll('.grid-item-black,.grid-item-white'));
		expect(cells).length(boardWidth * boardHeight);
	});

	/**
	 * Toggles a cell via the UI, then ensures that the visual state is consistent.
	 */
	it("Toggles a cell", async (): Promise<void> => {
		const sharedTreeConnection: SharedTreeConnection = { pixelEditorTreeView: undefined };
		const store = await setupStore(
			undefined,
			sharedTreeConnection);
		const { container } = render(
			<StoreContext.Provider value={store}>
				<Grid/>
			</StoreContext.Provider>);
		await waitForFluidConnection(sharedTreeConnection);

		const blackCellsBefore = Array.from(container.querySelectorAll('.grid-item-black'));
		const whiteCellsBefore = Array.from(container.querySelectorAll('.grid-item-white'));

		fireEvent.click(blackCellsBefore[0]);

		await waitFor(() => {
			const whiteCellsAfter = Array.from(container.querySelectorAll('.grid-item-white'));
			expect(whiteCellsAfter).length(whiteCellsBefore.length + 1);
		});
	});

	/**
	 * Toggles a cell and asserts that the backing tree has changed.
	 */
	it("Toggling a cell in the UI sets the corresponding cell in the backing Fluid Tree DDS", async (): Promise<void> => {
		const sharedTreeConnection: SharedTreeConnection = { pixelEditorTreeView: undefined };
		const store = await setupStore(
			undefined,
			sharedTreeConnection);
		const { container } = render(
			<StoreContext.Provider value={store}>
				<Grid/>
			</StoreContext.Provider>);
		await waitForFluidConnection(sharedTreeConnection);

		const blackCellsBefore = Array.from(container.querySelectorAll('.grid-item-black'));
		const whiteCellCountInModelBefore = countCellsInModel(sharedTreeConnection, 'white');

		fireEvent.click(blackCellsBefore[0]);

		await waitFor(() => {
			const whiteCellCountInModelAfter = countCellsInModel(sharedTreeConnection, 'white');
			expect(whiteCellCountInModelAfter).equals(whiteCellCountInModelBefore + 1);
		});
	});
});
