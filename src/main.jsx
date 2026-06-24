import React from 'react';
import ReactDOM from 'react-dom/client';
import { Client } from 'boardgame.io/react';
import { FiveOnTheFloor } from './game/FiveOnTheFloor';
import Board from './components/Board';
import './App.css';

const App = Client({
  game: FiveOnTheFloor,
  board: Board,
  debug: false,
});

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
