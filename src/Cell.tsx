import React from 'react';
import './Grid.css';

export interface CellProps {
	value: number;
	onClickCell: () => void;
}

export function Cell({ value, onClickCell}: CellProps) {
	const className = value === 0 ? 'grid-item-black' : 'grid-item-white';
	// biome-ignore lint/a11y/useKeyWithClickEvents: Non-useful event.
	return <div className={className} onClick={onClickCell} />;
}
