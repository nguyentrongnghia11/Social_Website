import { Link } from "react-router-dom";

import classNames from "classnames/bind";
import styles from "./MenuItem.module.scss";
const cx = classNames.bind(styles);
function MenuItem(prop) {

    return (

        <Link to={prop.to} className={ cx("menu-item")}  >
            <nav className={cx("menu-item")} >

                {prop.pr}

            </nav>
        </Link>

    )
}
export default MenuItem;