import { useEffect } from "react";
import { Outlet } from "react-router-dom";

export default function Products({ refreshProducts }) {
  useEffect(() => {
    refreshProducts(); // Call refreshProducts when component is mounted or products change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="App-header">
      <div style={{ padding: 20, marginTop: 35 }}>
        <h2>Products</h2>
        <Outlet />
      </div>
    </div>
  );
}
