import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToolPage } from './pages/ToolPage.js';
import { TokenMapPage } from './pages/TokenMapPage.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ToolPage />} />
        <Route path="/token-map" element={<TokenMapPage />} />
      </Routes>
    </BrowserRouter>
  );
}
