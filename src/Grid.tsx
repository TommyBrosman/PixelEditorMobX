import React from 'react';
import './Grid.css';
import { boardHeight, boardWidth } from './model/InitialItemBoard';
import { Cell } from './Cell';
import { observer } from "mobx-react-lite";
import { useAppStore } from './store/Hooks';

export const Grid = observer(() => {
	const store = useAppStore();
	const { itemBoard } = store;

	// Populate the board
	const items = itemBoard.length > 0
		? [...Array(boardWidth * boardHeight)].map((_, i) => {
			const x = i % boardWidth;
			const y = Math.floor(i / boardWidth);
			const value = itemBoard[y][x];

			const onClickCell = () => {
				// Toggle the color between white and black
				store.setCell(
					x,
					y,
					1 - value
				);
			}

			const key = `${x},${y}`;
			return <Cell key={key} onClickCell={onClickCell} value={value}/>
		}) : [];

	return (
		<div className="grid">
			{items}
		</div>
	);
});

export default Grid;
