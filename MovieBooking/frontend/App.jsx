import React from 'react';
import LoginPage from './LoginPage';
import SeatBookingPage from './SeatBookingPage';

function App() {
  const [token, setToken] = React.useState(localStorage.getItem('token') || '');

  return token ? (
    <SeatBookingPage token={token} setToken={setToken} />
  ) : (
    <LoginPage setToken={setToken} />
  );
}

export default App;
