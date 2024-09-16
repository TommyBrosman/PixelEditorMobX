import React from 'react';
import './App.css';
import Grid from './Grid';
import { StoreContext } from './store2/Hooks';
import { setupStore } from './store2/Store';

function App() {
	return (
		<StoreContext.Provider value={setupStore()}>
			<div className="App">
				<header className="App-header">
					<Grid />
				</header>
			</div>
		</StoreContext.Provider>
	);
}

export default App;
