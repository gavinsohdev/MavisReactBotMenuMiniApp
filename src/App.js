import { Route, Routes } from 'react-router-dom';
import HomePage from './HomePage';
import ShopPage from './ShopPage';
import OrderPage from './OrderPage';
import CartPage from './CartPage';
import RegistrationPendingPage from './RegistrationPendingPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/order" element={<OrderPage />} />
      <Route path="/pending/:userId" element={<RegistrationPendingPage />} />
    </Routes>
  );
}

export default App;