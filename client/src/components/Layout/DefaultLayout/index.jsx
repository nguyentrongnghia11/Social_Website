
import Header from "./Header";
import Sidebar from "./Sidebar";
import classNames from "classnames/bind";
import styles from "./DefaultLayout.module.scss";
import Footer from "./Footer";
import cookie from 'js-cookie';
import { useEffect, useState } from "react";
import instance from "~/Fetch/instance";

const cx = classNames.bind(styles);
function DefaultLayout({ children }) {

    const token = cookie.get('access_token');
    console.log(token);
    const [role, setRole] = useState('user');


    return (
        <div className={cx("wrapper")}>
            <Header getRole={(role) => {
                setRole(role)
            }} />
            <div className={cx("container")}>
                <Sidebar role={role} />

                <div className={cx("main-content")}>

                    {children}

                </div>
                <div className={cx("sidebar-content")}></div>
            </div>
            <Footer />
        </div>
    );
}
  

export default DefaultLayout;