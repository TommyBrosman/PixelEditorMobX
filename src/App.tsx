import React from 'react';
import './App.css';
import Grid from './Grid';
import { setupStore } from './store/Store';
import { Provider } from 'react-redux';

function App() {
	return (
		<Provider store={setupStore()}>
			<div className="App">
				<header className="App-header">
					<Grid />
				</header>
			</div>
		</Provider>
	);
}

export default App;
