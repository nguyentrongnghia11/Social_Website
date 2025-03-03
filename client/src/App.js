import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { publicRoutes, privateRoutes } from "~/routes";
import DefaultLayout from "./components/Layout/DefaultLayout";
import React from "react";


//import 'bootstrap/dist/css/bootstrap.min.css';



function App() {

  return (
    <>

      <Router>
        <div className="App">

          <Routes>
            {publicRoutes.map((route, key) => {

              let Layout = route.layout || DefaultLayout;
              
              
              return <Route key={key} path={route.path} element={<Layout><route.element /></Layout>}  ></Route>
            })}
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
