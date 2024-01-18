import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import {createBrowserRouter, Route, RouterProvider, createRoutesFromElements} from "react-router-dom"
import {Provider} from 'react-redux'
import {store} from './app/store'

import './index.css'
//pages
import HomePage from "./pages/HomePage";
import ErrorPage from "./pages/ErrorPage";
import DashboardPage from "./pages/DashboardPage";
import PrivateRoutes from "./utils/PrivateRoutes";

//router
const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path='/' element={<App />} errorElement={<ErrorPage />}>
            <Route path='/' element={<HomePage />} />
            <Route path='/dashboard' element={<PrivateRoutes />}>
                <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
        </Route>
    )
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>,
)
