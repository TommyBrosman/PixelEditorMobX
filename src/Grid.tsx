import React, { useEffect } from 'react';
import './Grid.css';
import { useAppDispatch, useRootSelector } from './store/Hooks';
import { boardHeight, boardWidth } from './store/InitialItemBoard';
import { Cell } from './Cell';
import { connectToFluid, setCell } from './store/Reducers';

export function Grid() {
	const isLoaded = useRootSelector(state => state.app.isLoaded);
	const itemBoard = useRootSelector(state => state.app.itemBoard);
	const dispatch = useAppDispatch();

	// Only connect once
	useEffect(() => {
		if (!isLoaded) {
			dispatch(connectToFluid());
		}
	}, [isLoaded, dispatch]);

	// Populate the board
	const items = itemBoard.length > 0
		? [...Array(boardWidth * boardHeight)].map((_, i) => {
			const x = i % boardWidth;
			const y = Math.floor(i / boardWidth);
			const value = itemBoard[y][x];

			const onClickCell = () => {
				// Toggle the color between white and black
				dispatch(setCell({
					x,
					y,
					value: 1 - value
				}));
			}

			const key = `${x},${y}`;
			return <Cell key={key} onClickCell={onClickCell} value={value}/>
		}) : [];

	return (
		<div className="grid">
			{items}
		</div>
	);
}

export default Grid;
