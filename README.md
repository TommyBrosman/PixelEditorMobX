# Pixel Editor

An editor for making pixel art built on top of the Fluid Framework, React, and Redux.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Architecture

This application uses a layered architecture and uses Redux for state management. There are three layers, each of which only
talks to the layer below it. Starting with the top layer:

- **Component Tree** - The React Component tree, which renders state and calls reducers/thunks as appropriate to perform edits.
  See Grid.tsx for the majority of the Component-level logic.
- **Redux Store** - Maintains application state. There are two distinct flows that occur in the Redux Store:
  - Edits to the Model. Implemented as thunks that close over the TreeView from the Model.
    The Store's thunks directly depend on the Model.
  - Propagation of state from the Model to the Component Tree. Implemented using reducers.
    Doesn't directly call component code: Redux handles the plumbing, so there is no direct dependency.
- **Model** - Encapsulates Fluid Tree initialization and editing. Exposes editing degrees of freedom as methods on the schema.

### Why use thunks for editing

A few approaches were considered at the beginning of the project:

- Initialize the Fluid Tree at module load time, then implement other edits using reducers
  - (Minor) Problem 1: This would require [top-level await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await#top_level_await) as initializing the tree in memory is async. Technically [browsers have supported this behavior since 2021](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await#browser_compatibility), though it would couple module loading with Fluid Tree loading.
  - Problem 2: This pattern doesn't address implementing Fluid Tree edits in a Redux-friendly manner.
- Put the Fluid TreeView in Redux State, implement all edits and Fluid Tree initialization logic as reducers
  - Problem 1: TreeViews are non-serializable from Redux's perspective. [Using non-serializable state](https://redux.js.org/faq/organizing-state#can-i-put-functions-promises-or-other-non-serializable-items-in-my-store-state) prevents the application from taking advantage of features like dehydration/rehydration of state.
  - Problem 2: Certain Tree-related operations are async, and thus are a bad fit for reducers. The Redux documentation [suggests using middleware instead](https://redux.js.org/tutorials/fundamentals/part-6-async-logic).
- Put all async edits and methods that depend on Fluid state into middleware
  - Problem: Middleware on its own can only intercept and modify existing reducers. An API for dispatching async reducer-like actions is what we really need.

The final approach:

- Implement all async logic and methods that depend on Fluid state as thunks, then propagate Fluid state changes forward using reducers
  - (Minor) Problem: maintaining logic in both directions requires some boilerplate code. There are thunks that call Fluid Tree-level methods because the thunk's signature must match what Redux expects (i.e., a function returning a function where the outer function takes a parameter from the Redux thunk middleware).

An example thunk:

```ts
export const thunkSetCell =
    (_dispatch, _getState, sharedTreeConnection: SharedTreeConnection) =>
        async (x: number, y: number, value: number): Promise<void> => {
            // Can fail if thunkSetCell runs before the tree is loaded
            sharedTreeConnection.pixelEditorTreeView?.root.setCell(x, y, value);
        }
```

The `sharedTreeConnection` object is injected by the thunk middleware at dispatch time:

```ts
const onClickCell = () => {
    // Toggle the color between white and black
    dispatch(setCell({
        x,
        y,
        value: 1 - entry
    }));
}
```
