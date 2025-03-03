
import classNames from "classnames/bind";
import styles from "./MenuItem.module.scss";

const cx = classNames.bind(styles);
function Menu({ children }) {
    

    console.log(children);
    
    return (
        <aside className={cx('menu')}>
            {children}
        </aside>
    )
}

export default Menu;