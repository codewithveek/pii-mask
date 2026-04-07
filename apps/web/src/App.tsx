import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToolPage } from './pages/ToolPage.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ToolPage />} />
      </Routes>
    </BrowserRouter>
  );
}
