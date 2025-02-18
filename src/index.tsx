import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { setupStore } from './store/Store';
import { StoreContext } from './store/Hooks';

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);

setupStore().then((store) =>
	root.render(
		<StoreContext.Provider value={store}>
			<React.StrictMode>
				<App />
			</React.StrictMode>
		</StoreContext.Provider>
	)
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
